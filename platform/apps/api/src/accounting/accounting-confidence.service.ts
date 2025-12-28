import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface ReconciliationStatus {
  status: "reconciled" | "pending" | "discrepancy";
  lastReconciledAt: Date | null;
  discrepancyCents: number;
  details: {
    expectedCents: number;
    actualCents: number;
    difference: number;
  };
}

export interface MonthEndCloseStatus {
  month: string;
  status: "open" | "review" | "closed" | "locked";
  closedBy: string | null;
  closedAt: Date | null;
  metrics: {
    totalRevenueCents: number;
    totalRefundsCents: number;
    totalPayoutsCents: number;
    totalPlatformFeesCents: number;
    netRevenueCents: number;
  };
  checklistItems: Array<{
    name: string;
    status: "pending" | "completed" | "failed";
    note?: string;
  }>;
}

export interface ConfidenceScore {
  score: number; // 0-100
  level: "high" | "medium" | "low";
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    status: "good" | "warning" | "error";
    message: string;
  }>;
}

@Injectable()
export class AccountingConfidenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate overall accounting confidence score for a campground
   */
  async getConfidenceScore(campgroundId: string, month?: string): Promise<ConfidenceScore> {
    const targetMonth = month ?? this.getCurrentMonth();
    const { start, end } = this.getMonthBounds(targetMonth);

    const factors: ConfidenceScore["factors"] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    // Factor 1: Payout Reconciliation (weight: 40)
    const payoutFactor = await this.checkPayoutReconciliation(campgroundId, start, end);
    factors.push(payoutFactor);
    totalWeight += payoutFactor.weight;
    weightedScore += payoutFactor.score * payoutFactor.weight;

    // Factor 2: Payment-Reservation Match (weight: 25)
    const paymentFactor = await this.checkPaymentReservationMatch(campgroundId, start, end);
    factors.push(paymentFactor);
    totalWeight += paymentFactor.weight;
    weightedScore += paymentFactor.score * paymentFactor.weight;

    // Factor 3: Pending Transactions (weight: 15)
    const pendingFactor = await this.checkPendingTransactions(campgroundId, start, end);
    factors.push(pendingFactor);
    totalWeight += pendingFactor.weight;
    weightedScore += pendingFactor.score * pendingFactor.weight;

    // Factor 4: Disputes and Refunds (weight: 10)
    const disputeFactor = await this.checkDisputesAndRefunds(campgroundId, start, end);
    factors.push(disputeFactor);
    totalWeight += disputeFactor.weight;
    weightedScore += disputeFactor.score * disputeFactor.weight;

    // Factor 5: Month-End Close Status (weight: 10)
    const closeFactor = await this.checkMonthEndClose(campgroundId, targetMonth);
    factors.push(closeFactor);
    totalWeight += closeFactor.weight;
    weightedScore += closeFactor.score * closeFactor.weight;

    const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const level = score >= 85 ? "high" : score >= 60 ? "medium" : "low";

    return { score, level, factors };
  }

  /**
   * Get payout reconciliation status
   */
  async getPayoutReconciliation(campgroundId: string, month?: string): Promise<ReconciliationStatus> {
    const targetMonth = month ?? this.getCurrentMonth();
    const { start, end } = this.getMonthBounds(targetMonth);

    // Get expected payouts from successful payments
    const payments = await this.prisma.payment.aggregate({
      where: {
        reservation: { campgroundId },
        createdAt: { gte: start, lte: end },
        status: "succeeded",
      },
      _sum: { amountCents: true, feeAmountCents: true },
    });

    const expectedCents = (payments._sum.amountCents ?? 0) - (payments._sum.feeAmountCents ?? 0);

    // Get actual payouts
    const payouts = await this.prisma.payout.aggregate({
      where: {
        campgroundId,
        paidAt: { gte: start, lte: end },
        status: "paid",
      },
      _sum: { amountCents: true },
    });

    const actualCents = payouts._sum.amountCents ?? 0;
    const difference = actualCents - expectedCents;

    // Allow small discrepancy due to timing
    const threshold = Math.max(100, expectedCents * 0.01); // 1% or $1
    const status = Math.abs(difference) <= threshold ? "reconciled" : "discrepancy";

    const lastPayout = await this.prisma.payout.findFirst({
      where: { campgroundId, status: "paid" },
      orderBy: { paidAt: "desc" },
    });

    return {
      status,
      lastReconciledAt: lastPayout?.paidAt ?? null,
      discrepancyCents: difference,
      details: { expectedCents, actualCents, difference },
    };
  }

  /**
   * Get month-end close status
   */
  async getMonthEndCloseStatus(campgroundId: string, month: string): Promise<MonthEndCloseStatus> {
    const { start, end } = this.getMonthBounds(month);

    // Check if month is closed
    const closeRecord = await (this.prisma as any).monthEndClose?.findFirst?.({
      where: { campgroundId, month },
    });

    // Calculate metrics
    const [revenue, refunds, payouts, platformFees] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          reservation: { campgroundId },
          createdAt: { gte: start, lte: end },
          status: "succeeded",
        },
        _sum: { amountCents: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          reservation: { campgroundId },
          createdAt: { gte: start, lte: end },
          status: "refunded",
        },
        _sum: { amountCents: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          campgroundId,
          paidAt: { gte: start, lte: end },
          status: "paid",
        },
        _sum: { amountCents: true },
      }),
      this.getPlatformFeesForPeriod(campgroundId, start, end),
    ]);

    const totalRevenueCents = revenue._sum.amountCents ?? 0;
    const totalRefundsCents = refunds._sum.amountCents ?? 0;
    const totalPayoutsCents = payouts._sum.amountCents ?? 0;
    const totalPlatformFeesCents = platformFees;
    const netRevenueCents = totalRevenueCents - totalRefundsCents - totalPlatformFeesCents;

    // Build checklist
    const checklistItems = await this.buildMonthEndChecklist(campgroundId, start, end);

    return {
      month,
      status: closeRecord?.status ?? "open",
      closedBy: closeRecord?.closedBy ?? null,
      closedAt: closeRecord?.closedAt ?? null,
      metrics: {
        totalRevenueCents,
        totalRefundsCents,
        totalPayoutsCents,
        totalPlatformFeesCents,
        netRevenueCents,
      },
      checklistItems,
    };
  }

  /**
   * Initiate month-end close process
   */
  async initiateMonthEndClose(campgroundId: string, month: string, userId: string) {
    // Validate all checklist items are complete
    const { start, end } = this.getMonthBounds(month);
    const checklist = await this.buildMonthEndChecklist(campgroundId, start, end);
    const incompleteTasks = checklist.filter(item => item.status !== "completed");

    if (incompleteTasks.length > 0) {
      return {
        success: false,
        message: "Cannot close month with incomplete tasks",
        incompleteTasks,
      };
    }

    // Create or update close record
    const existing = await (this.prisma as any).monthEndClose?.findFirst?.({
      where: { campgroundId, month },
    });

    if (existing) {
      await (this.prisma as any).monthEndClose?.update?.({
        where: { id: existing.id },
        data: { status: "review", initiatedBy: userId, initiatedAt: new Date() },
      });
    } else {
      await (this.prisma as any).monthEndClose?.create?.({
        data: {
          campgroundId,
          month,
          status: "review",
          initiatedBy: userId,
          initiatedAt: new Date(),
        },
      });
    }

    return { success: true, message: "Month-end close initiated for review" };
  }

  /**
   * Approve and finalize month-end close
   */
  async approveMonthEndClose(campgroundId: string, month: string, userId: string) {
    const closeRecord = await (this.prisma as any).monthEndClose?.findFirst?.({
      where: { campgroundId, month },
    });

    if (!closeRecord || closeRecord.status !== "review") {
      return { success: false, message: "Month must be in review status to approve" };
    }

    await (this.prisma as any).monthEndClose?.update?.({
      where: { id: closeRecord.id },
      data: {
        status: "closed",
        closedBy: userId,
        closedAt: new Date(),
      },
    });

    return { success: true, message: "Month-end close approved and finalized" };
  }

  // Helper methods

  private async checkPayoutReconciliation(campgroundId: string, start: Date, end: Date): Promise<ConfidenceScore["factors"][0]> {
    const recon = await this.getPayoutReconciliation(campgroundId, `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`);

    if (recon.status === "reconciled") {
      return {
        name: "Payout Reconciliation",
        score: 100,
        weight: 40,
        status: "good",
        message: "All payouts reconciled successfully",
      };
    }

    const discrepancyPct = recon.details.expectedCents > 0
      ? Math.abs(recon.discrepancyCents) / recon.details.expectedCents
      : 0;

    if (discrepancyPct < 0.05) {
      return {
        name: "Payout Reconciliation",
        score: 75,
        weight: 40,
        status: "warning",
        message: `Minor discrepancy: $${(recon.discrepancyCents / 100).toFixed(2)}`,
      };
    }

    return {
      name: "Payout Reconciliation",
      score: 25,
      weight: 40,
      status: "error",
      message: `Significant discrepancy: $${(recon.discrepancyCents / 100).toFixed(2)}`,
    };
  }

  private async checkPaymentReservationMatch(campgroundId: string, start: Date, end: Date): Promise<ConfidenceScore["factors"][0]> {
    // Check if all payments have linked reservations
    const orphanPayments = await this.prisma.payment.count({
      where: {
        reservation: { campgroundId },
        createdAt: { gte: start, lte: end },
        reservationId: null,
      },
    });

    const totalPayments = await this.prisma.payment.count({
      where: {
        reservation: { campgroundId },
        createdAt: { gte: start, lte: end },
      },
    });

    if (orphanPayments === 0) {
      return {
        name: "Payment-Reservation Match",
        score: 100,
        weight: 25,
        status: "good",
        message: "All payments linked to reservations",
      };
    }

    const matchRate = totalPayments > 0 ? ((totalPayments - orphanPayments) / totalPayments) * 100 : 100;

    if (matchRate >= 95) {
      return {
        name: "Payment-Reservation Match",
        score: 80,
        weight: 25,
        status: "warning",
        message: `${orphanPayments} unlinked payment(s)`,
      };
    }

    return {
      name: "Payment-Reservation Match",
      score: 40,
      weight: 25,
      status: "error",
      message: `${orphanPayments} unlinked payments (${(100 - matchRate).toFixed(1)}% unmatched)`,
    };
  }

  private async checkPendingTransactions(campgroundId: string, start: Date, end: Date): Promise<ConfidenceScore["factors"][0]> {
    const pendingPayments = await this.prisma.payment.count({
      where: {
        reservation: { campgroundId },
        createdAt: { gte: start, lte: end },
        status: { in: ["pending", "processing"] },
      },
    });

    const pendingPayouts = await this.prisma.payout.count({
      where: {
        campgroundId,
        createdAt: { gte: start, lte: end },
        status: { in: ["pending", "in_transit"] },
      },
    });

    const total = pendingPayments + pendingPayouts;

    if (total === 0) {
      return {
        name: "Pending Transactions",
        score: 100,
        weight: 15,
        status: "good",
        message: "No pending transactions",
      };
    }

    if (total <= 5) {
      return {
        name: "Pending Transactions",
        score: 70,
        weight: 15,
        status: "warning",
        message: `${total} transaction(s) still pending`,
      };
    }

    return {
      name: "Pending Transactions",
      score: 30,
      weight: 15,
      status: "error",
      message: `${total} pending transactions need attention`,
    };
  }

  private async checkDisputesAndRefunds(campgroundId: string, start: Date, end: Date): Promise<ConfidenceScore["factors"][0]> {
    const openDisputes = await this.prisma.dispute.count({
      where: {
        campgroundId,
        createdAt: { gte: start, lte: end },
        status: { in: ["needs_response", "under_review"] },
      },
    });

    if (openDisputes === 0) {
      return {
        name: "Disputes & Refunds",
        score: 100,
        weight: 10,
        status: "good",
        message: "No open disputes",
      };
    }

    if (openDisputes <= 2) {
      return {
        name: "Disputes & Refunds",
        score: 60,
        weight: 10,
        status: "warning",
        message: `${openDisputes} open dispute(s) need response`,
      };
    }

    return {
      name: "Disputes & Refunds",
      score: 20,
      weight: 10,
      status: "error",
      message: `${openDisputes} open disputes require attention`,
    };
  }

  private async checkMonthEndClose(campgroundId: string, month: string): Promise<ConfidenceScore["factors"][0]> {
    const closeRecord = await (this.prisma as any).monthEndClose?.findFirst?.({
      where: { campgroundId, month },
    });

    if (closeRecord?.status === "closed" || closeRecord?.status === "locked") {
      return {
        name: "Month-End Close",
        score: 100,
        weight: 10,
        status: "good",
        message: "Month closed and verified",
      };
    }

    if (closeRecord?.status === "review") {
      return {
        name: "Month-End Close",
        score: 70,
        weight: 10,
        status: "warning",
        message: "Pending approval",
      };
    }

    // For current month, it's okay to be open
    const currentMonth = this.getCurrentMonth();
    if (month === currentMonth) {
      return {
        name: "Month-End Close",
        score: 80,
        weight: 10,
        status: "good",
        message: "Current month (not yet closeable)",
      };
    }

    return {
      name: "Month-End Close",
      score: 30,
      weight: 10,
      status: "error",
      message: "Prior month not closed",
    };
  }

  private async buildMonthEndChecklist(campgroundId: string, start: Date, end: Date): Promise<MonthEndCloseStatus["checklistItems"]> {
    const items: MonthEndCloseStatus["checklistItems"] = [];

    // Check 1: All payments processed
    const pendingPayments = await this.prisma.payment.count({
      where: {
        reservation: { campgroundId },
        createdAt: { gte: start, lte: end },
        status: { in: ["pending", "processing"] },
      },
    });
    items.push({
      name: "All payments processed",
      status: pendingPayments === 0 ? "completed" : "pending",
      note: pendingPayments > 0 ? `${pendingPayments} pending` : undefined,
    });

    // Check 2: All payouts reconciled
    const unreconciled = await this.prisma.payout.count({
      where: {
        campgroundId,
        createdAt: { gte: start, lte: end },
        status: { not: "paid" },
      },
    });
    items.push({
      name: "All payouts reconciled",
      status: unreconciled === 0 ? "completed" : "pending",
      note: unreconciled > 0 ? `${unreconciled} pending` : undefined,
    });

    // Check 3: No open disputes
    const openDisputes = await this.prisma.dispute.count({
      where: {
        campgroundId,
        createdAt: { gte: start, lte: end },
        status: { in: ["needs_response", "under_review"] },
      },
    });
    items.push({
      name: "No open disputes",
      status: openDisputes === 0 ? "completed" : "failed",
      note: openDisputes > 0 ? `${openDisputes} open` : undefined,
    });

    // Check 4: Billing period invoiced
    const campground = await this.prisma.campground.findUnique({
      where: { id: campgroundId },
      select: { organizationId: true },
    });

    if (campground?.organizationId) {
      const billingPeriod = await this.prisma.organizationBillingPeriod.findFirst({
        where: {
          organizationId: campground.organizationId,
          periodStart: { lte: end },
          periodEnd: { gte: start },
        },
      });
      items.push({
        name: "Platform billing invoiced",
        status: billingPeriod?.status === "invoiced" || billingPeriod?.status === "paid" ? "completed" : "pending",
      });
    }

    return items;
  }

  private async getPlatformFeesForPeriod(campgroundId: string, start: Date, end: Date): Promise<number> {
    const fees = await this.prisma.usageEvent.aggregate({
      where: {
        campgroundId,
        createdAt: { gte: start, lte: end },
      },
      _sum: { unitCents: true },
    });
    return fees._sum.unitCents ?? 0;
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  private getMonthBounds(month: string): { start: Date; end: Date } {
    const [year, monthNum] = month.split("-").map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0, 23, 59, 59);
    return { start, end };
  }
}
