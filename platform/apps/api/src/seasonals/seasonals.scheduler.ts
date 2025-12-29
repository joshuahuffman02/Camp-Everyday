import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { SeasonalPaymentStatus } from "@prisma/client";

@Injectable()
export class SeasonalsScheduler {
  private readonly logger = new Logger(SeasonalsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daily job to mark overdue seasonal payments as past_due
   * Runs at 1:00 AM every day
   */
  @Cron("0 1 * * *")
  async markOverduePayments() {
    const now = new Date();

    try {
      // Find all payments that are due or scheduled but have passed their due date
      const result = await this.prisma.seasonalPayment.updateMany({
        where: {
          status: { in: [SeasonalPaymentStatus.due, SeasonalPaymentStatus.scheduled] },
          dueDate: { lt: now },
        },
        data: {
          status: SeasonalPaymentStatus.past_due,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Marked ${result.count} seasonal payments as past_due`);
      }
    } catch (error) {
      this.logger.error(`Failed to mark overdue payments: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Weekly job to send payment reminder notifications
   * Runs at 9:00 AM every Monday
   */
  @Cron("0 9 * * 1")
  async sendPaymentReminders() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      // Find payments due within the next 7 days
      const upcomingPayments = await this.prisma.seasonalPayment.findMany({
        where: {
          status: { in: [SeasonalPaymentStatus.due, SeasonalPaymentStatus.scheduled] },
          dueDate: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        include: {
          seasonalGuest: {
            include: {
              guest: { select: { email: true, primaryFirstName: true } },
              campground: { select: { id: true, name: true } },
            },
          },
        },
      });

      this.logger.log(`Found ${upcomingPayments.length} seasonal payments due within 7 days`);

      // Group by campground for potential notification batching
      const byCampground = new Map<string, typeof upcomingPayments>();
      for (const payment of upcomingPayments) {
        const cgId = payment.seasonalGuest?.campground?.id;
        if (!cgId) continue;
        const list = byCampground.get(cgId) || [];
        list.push(payment);
        byCampground.set(cgId, list);
      }

      // Log summary for each campground
      for (const [campgroundId, payments] of byCampground) {
        const campgroundName = payments[0]?.seasonalGuest?.campground?.name || campgroundId;
        this.logger.log(`${campgroundName}: ${payments.length} upcoming seasonal payments`);
      }

      // Note: Actual email sending would be done via EmailService
      // For now, we just log the counts for ops visibility
    } catch (error) {
      this.logger.error(`Failed to process payment reminders: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Monthly job to generate payment schedules for the next month
   * Runs at 6:00 AM on the 25th of each month
   */
  @Cron("0 6 25 * *")
  async generateNextMonthPayments() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    try {
      // Find active seasonal guests with monthly billing who don't have a payment for next month
      const seasonalsNeedingPayment = await this.prisma.seasonalGuest.findMany({
        where: {
          status: "active",
          // Only process monthly billing guests
          payments: {
            none: {
              dueDate: {
                gte: nextMonth,
                lte: nextMonthEnd,
              },
            },
          },
        },
        include: {
          pricing: {
            where: { seasonYear: nextMonth.getFullYear() },
            take: 1,
          },
        },
      });

      let created = 0;

      for (const seasonal of seasonalsNeedingPayment) {
        const pricing = seasonal.pricing[0];
        if (!pricing) continue;

        // Calculate monthly amount from annual rate
        // Assuming 6-month season for now (can be enhanced with rate card dates)
        const monthlyAmount = (pricing.finalRate as any)?.toNumber?.() / 6 || 0;

        if (monthlyAmount > 0) {
          await this.prisma.seasonalPayment.create({
            data: {
              seasonalGuestId: seasonal.id,
              campgroundId: seasonal.campgroundId,
              seasonYear: nextMonth.getFullYear(),
              amount: monthlyAmount,
              dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), seasonal.paymentDay || 1),
              status: SeasonalPaymentStatus.scheduled,
            },
          });
          created++;
        }
      }

      if (created > 0) {
        this.logger.log(`Generated ${created} seasonal payment records for ${nextMonth.toLocaleString("default", { month: "long", year: "numeric" })}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate next month payments: ${error instanceof Error ? error.message : error}`);
    }
  }
}
