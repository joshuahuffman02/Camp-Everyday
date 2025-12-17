import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Lightweight service for recording usage events for billing.
 * This service has minimal dependencies to avoid circular imports.
 *
 * Usage events are recorded to the database and later processed
 * by the SubscriptionService to report to Stripe.
 */
@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a booking created event for billing
   */
  async trackBookingCreated(
    reservationId: string,
    campgroundId: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      // Get organization from campground
      const campground = await this.prisma.campground.findUnique({
        where: { id: campgroundId },
        select: { organizationId: true },
      });

      if (!campground?.organizationId) {
        this.logger.warn(`No organization found for campground ${campgroundId}`);
        return;
      }

      await this.prisma.usageEvent.create({
        data: {
          organizationId: campground.organizationId,
          campgroundId,
          eventType: "booking_created",
          quantity: 1,
          referenceType: "reservation",
          referenceId: reservationId,
          metadata: metadata ?? {},
        },
      });

      this.logger.debug(
        `Tracked booking_created for reservation ${reservationId}, org ${campground.organizationId}`
      );
    } catch (error) {
      // Log but don't fail the reservation creation
      this.logger.error(`Failed to track booking_created:`, error);
    }
  }

  /**
   * Record an SMS sent event for billing
   */
  async trackSmsSent(
    organizationId: string,
    campgroundId: string | null,
    direction: "outbound" | "inbound",
    messageId?: string,
    segmentCount: number = 1
  ) {
    try {
      await this.prisma.usageEvent.create({
        data: {
          organizationId,
          campgroundId,
          eventType: direction === "outbound" ? "sms_outbound" : "sms_inbound",
          quantity: segmentCount,
          referenceType: "message",
          referenceId: messageId,
        },
      });

      this.logger.debug(
        `Tracked sms_${direction} for org ${organizationId}, segments: ${segmentCount}`
      );
    } catch (error) {
      this.logger.error(`Failed to track SMS usage:`, error);
    }
  }

  /**
   * Record AI usage for billing (future use)
   */
  async trackAiUsage(
    organizationId: string,
    campgroundId: string | null,
    tokenCount: number,
    modelId?: string
  ) {
    try {
      await this.prisma.usageEvent.create({
        data: {
          organizationId,
          campgroundId,
          eventType: "ai_usage",
          quantity: tokenCount,
          metadata: modelId ? { modelId } : {},
        },
      });

      this.logger.debug(
        `Tracked ai_usage for org ${organizationId}, tokens: ${tokenCount}`
      );
    } catch (error) {
      this.logger.error(`Failed to track AI usage:`, error);
    }
  }
}
