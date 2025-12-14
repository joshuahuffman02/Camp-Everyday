import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { Cron, CronExpression } from "@nestjs/schedule";

type ReportType = "occupancy_summary" | "revenue_summary" | "arrivals_departures" |
    "maintenance_summary" | "reservation_activity" | "guest_activity" | "financial_summary";
type ReportFrequency = "daily" | "weekly" | "monthly";

@Injectable()
export class ReportSubscriptionService {
    private readonly logger = new Logger(ReportSubscriptionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    async findByUser(userId: string) {
        return this.prisma.reportSubscription.findMany({
            where: { userId },
            orderBy: { reportType: "asc" },
        });
    }

    async findByCampground(campgroundId: string) {
        return this.prisma.reportSubscription.findMany({
            where: { campgroundId },
            orderBy: { reportType: "asc" },
        });
    }

    async create(data: {
        userId: string;
        userEmail: string;
        campgroundId?: string;
        reportType: ReportType;
        frequency: ReportFrequency;
        deliveryTime?: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
    }) {
        const nextSendAt = this.calculateNextSendAt(data.frequency, data.dayOfWeek, data.dayOfMonth);

        return this.prisma.reportSubscription.create({
            data: {
                ...data,
                nextSendAt,
            } as any,
        });
    }

    async update(id: string, data: {
        enabled?: boolean;
        frequency?: ReportFrequency;
        deliveryTime?: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
    }) {
        const subscription = await this.prisma.reportSubscription.findUnique({ where: { id } });
        if (!subscription) throw new NotFoundException("Subscription not found");

        const nextSendAt = this.calculateNextSendAt(
            (data.frequency as ReportFrequency) || (subscription.frequency as ReportFrequency),
            data.dayOfWeek ?? subscription.dayOfWeek ?? undefined,
            data.dayOfMonth ?? subscription.dayOfMonth ?? undefined
        );

        return this.prisma.reportSubscription.update({
            where: { id },
            data: {
                ...data,
                nextSendAt,
            } as any,
        });
    }

    async delete(id: string) {
        return this.prisma.reportSubscription.delete({ where: { id } });
    }

    private calculateNextSendAt(frequency: ReportFrequency, dayOfWeek?: number, dayOfMonth?: number): Date {
        const now = new Date();
        const next = new Date(now);
        next.setHours(8, 0, 0, 0); // Default to 8 AM

        switch (frequency) {
            case "daily":
                if (now.getHours() >= 8) {
                    next.setDate(next.getDate() + 1);
                }
                break;
            case "weekly":
                const targetDay = dayOfWeek ?? 1; // Default Monday
                const currentDay = now.getDay();
                const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
                next.setDate(next.getDate() + daysUntil);
                break;
            case "monthly":
                const targetDate = dayOfMonth ?? 1;
                next.setDate(targetDate);
                if (next <= now) {
                    next.setMonth(next.getMonth() + 1);
                }
                break;
        }

        return next;
    }

    // Run every hour to check for reports to send
    @Cron(CronExpression.EVERY_HOUR)
    async processScheduledReports() {
        const now = new Date();

        const dueSubscriptions = await this.prisma.reportSubscription.findMany({
            where: {
                enabled: true,
                nextSendAt: { lte: now },
            },
        });

        this.logger.log(`Processing ${dueSubscriptions.length} scheduled reports`);

        for (const subscription of dueSubscriptions) {
            try {
                await this.generateAndSendReport(subscription);

                // Update last sent and next send times
                const nextSendAt = this.calculateNextSendAt(
                    subscription.frequency as ReportFrequency,
                    subscription.dayOfWeek ?? undefined,
                    subscription.dayOfMonth ?? undefined
                );

                await this.prisma.reportSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        lastSentAt: now,
                        nextSendAt,
                    },
                });

                this.logger.log(`Sent ${subscription.reportType} report to ${subscription.userEmail}`);
            } catch (err) {
                this.logger.error(`Failed to send report ${subscription.id}: ${err}`);
            }
        }
    }

    private async generateAndSendReport(subscription: any) {
        // Get campground name if applicable
        let campgroundName: string | undefined;
        if (subscription.campgroundId) {
            const campground = await this.prisma.campground.findUnique({
                where: { id: subscription.campgroundId },
                select: { name: true },
            });
            campgroundName = campground?.name;
        }

        // Generate report data based on type
        const reportData = await this.generateReportData(
            subscription.reportType,
            subscription.campgroundId,
            subscription.frequency as ReportFrequency
        );

        // Send the email
        await this.emailService.sendScheduledReport({
            to: subscription.userEmail,
            reportName: this.getReportDisplayName(subscription.reportType),
            campgroundName,
            period: this.getPeriodLabel(subscription.frequency as ReportFrequency),
            summary: reportData.summary,
            metrics: reportData.metrics,
            reportUrl: reportData.reportUrl,
        });
    }

    private getReportDisplayName(type: string): string {
        const names: Record<string, string> = {
            occupancy_summary: "Occupancy Summary",
            revenue_summary: "Revenue Summary",
            arrivals_departures: "Arrivals & Departures",
            maintenance_summary: "Maintenance Summary",
            reservation_activity: "Reservation Activity",
            guest_activity: "Guest Activity",
            financial_summary: "Financial Summary",
        };
        return names[type] || type;
    }

    private getPeriodLabel(frequency: ReportFrequency): string {
        const now = new Date();
        switch (frequency) {
            case "daily":
                return now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
            case "weekly":
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            case "monthly":
                return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            default:
                return "Report";
        }
    }

    private async generateReportData(type: string, campgroundId: string | null, frequency: ReportFrequency): Promise<{
        summary: string;
        metrics?: { label: string; value: string }[];
        reportUrl?: string;
    }> {
        // Calculate date range based on frequency
        const now = new Date();
        const startDate = new Date(now);

        switch (frequency) {
            case "daily":
                startDate.setDate(now.getDate() - 1);
                break;
            case "weekly":
                startDate.setDate(now.getDate() - 7);
                break;
            case "monthly":
                startDate.setMonth(now.getMonth() - 1);
                break;
        }

        // Generate data based on report type
        // For now, return placeholder data - in production, you'd query real metrics
        switch (type) {
            case "occupancy_summary":
                return {
                    summary: "Your campground occupancy performance for the period.",
                    metrics: [
                        { label: "Average Occupancy", value: "75%" },
                        { label: "Peak Occupancy", value: "92%" },
                        { label: "Total Nights Sold", value: "156" },
                    ],
                };
            case "revenue_summary":
                return {
                    summary: "Revenue breakdown for the reporting period.",
                    metrics: [
                        { label: "Total Revenue", value: "$12,450" },
                        { label: "Reservation Revenue", value: "$10,200" },
                        { label: "Fees & Add-ons", value: "$2,250" },
                    ],
                };
            case "arrivals_departures":
                return {
                    summary: "Arrivals and departures summary.",
                    metrics: [
                        { label: "Arrivals", value: "23" },
                        { label: "Departures", value: "19" },
                        { label: "Current Guests", value: "45" },
                    ],
                };
            case "maintenance_summary":
                return {
                    summary: "Maintenance activity for the period.",
                    metrics: [
                        { label: "Open Tickets", value: "3" },
                        { label: "Resolved", value: "12" },
                        { label: "Avg Resolution Time", value: "4.2 hours" },
                    ],
                };
            default:
                return {
                    summary: `Your ${this.getReportDisplayName(type)} for the period.`,
                    metrics: [],
                };
        }
    }
}
