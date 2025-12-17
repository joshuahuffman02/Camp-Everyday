import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { OrgBillingService } from "./org-billing.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("organizations/:organizationId/billing")
@UseGuards(JwtAuthGuard)
export class OrgBillingController {
  constructor(private billingService: OrgBillingService) {}

  /**
   * Get billing summary for current period
   */
  @Get("summary")
  async getBillingSummary(@Param("organizationId") organizationId: string) {
    return this.billingService.getBillingSummary(organizationId);
  }

  /**
   * Get current billing period
   */
  @Get("current-period")
  async getCurrentPeriod(@Param("organizationId") organizationId: string) {
    return this.billingService.getCurrentPeriod(organizationId);
  }

  /**
   * Get billing history
   */
  @Get("history")
  async getBillingHistory(
    @Param("organizationId") organizationId: string,
    @Query("limit") limit?: string
  ) {
    return this.billingService.getBillingHistory(
      organizationId,
      limit ? parseInt(limit, 10) : 12
    );
  }

  /**
   * Get usage details
   */
  @Get("usage")
  async getUsageDetails(
    @Param("organizationId") organizationId: string,
    @Query("eventType") eventType?: string,
    @Query("periodStart") periodStartStr?: string,
    @Query("periodEnd") periodEndStr?: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string
  ) {
    const periodStart = periodStartStr ? new Date(periodStartStr) : undefined;
    const periodEnd = periodEndStr ? new Date(periodEndStr) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.billingService.getUsageDetails(
      organizationId,
      eventType,
      periodStart,
      periodEnd,
      limit,
      offset
    );
  }

  /**
   * Record a usage event (internal use / testing)
   */
  @Post("usage")
  async recordUsageEvent(
    @Param("organizationId") organizationId: string,
    @Body()
    body: {
      campgroundId?: string;
      eventType: string;
      quantity?: number;
      referenceType?: string;
      referenceId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.billingService.recordUsageEvent({
      organizationId,
      ...body,
    });
  }

  /**
   * Finalize a billing period (admin only)
   */
  @Post("periods/:periodId/finalize")
  async finalizePeriod(@Param("periodId") periodId: string) {
    return this.billingService.finalizePeriod(periodId);
  }

  /**
   * Mark period as paid (webhook / admin)
   */
  @Post("periods/:periodId/paid")
  async markPeriodPaid(
    @Param("periodId") periodId: string,
    @Body() body: { stripePaymentIntentId?: string }
  ) {
    return this.billingService.markPeriodPaid(periodId, body.stripePaymentIntentId);
  }
}
