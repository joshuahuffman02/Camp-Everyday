import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "./stripe.service";
import fetch from "node-fetch";

@Injectable()
export class PaymentsReconciliationService {
  private readonly logger = new Logger(PaymentsReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService
  ) { }

  async sendAlert(message: string) {
    const webhook = process.env.ALERT_WEBHOOK_URL;
    if (!webhook) {
      this.logger.warn(`Alert (no webhook configured): ${message}`);
      return;
    }
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message })
      });
    } catch (err) {
      this.logger.warn(`Failed to send alert: ${err instanceof Error ? err.message : err}`);
    }
  }

  async lookupCampgroundIdByStripeAccount(accountId?: string | null) {
    if (!accountId) return '';
    const cg = await (this.prisma as any).campground.findFirst({
      where: { stripeAccountId: accountId },
      select: { id: true }
    } as any);
    return cg?.id ?? '';
  }

  private async createLedgerEntryOnce(opts: {
    campgroundId: string;
    reservationId?: string | null;
    glCode: string;
    account: string;
    description: string;
    amountCents: number;
    direction: "debit" | "credit";
    occurredAt?: Date;
  }) {
    const exists = await (this.prisma as any).ledgerEntry.findFirst({
      where: {
        campgroundId: opts.campgroundId,
        reservationId: opts.reservationId || undefined,
        description: opts.description,
        amountCents: opts.amountCents,
        direction: opts.direction
      },
      select: { id: true }
    });
    if (exists) return exists;
    return (this.prisma as any).ledgerEntry.create({
      data: {
        campgroundId: opts.campgroundId,
        reservationId: opts.reservationId || null,
        glCode: opts.glCode,
        account: opts.account,
        description: opts.description,
        amountCents: opts.amountCents,
        direction: opts.direction,
        occurredAt: opts.occurredAt ?? new Date()
      }
    });
  }

  private async createPayoutLine(opts: {
    payoutId: string;
    type: string;
    amount: number;
    currency?: string;
    description?: string;
    reservationId?: string | null;
    paymentIntentId?: string | null;
    chargeId?: string | null;
    balanceTransactionId?: string | null;
  }) {
    return (this.prisma as any).payoutLine.create({
      data: {
        payoutId: opts.payoutId,
        type: opts.type,
        amountCents: opts.amount,
        currency: opts.currency || 'usd',
        description: opts.description,
        reservationId: opts.reservationId || null,
        paymentIntentId: opts.paymentIntentId || null,
        chargeId: opts.chargeId || null,
        balanceTransactionId: opts.balanceTransactionId || null
      }
    });
  }

  async upsertDispute(dispute: any) {
    const reservationId = dispute.metadata?.reservationId ?? null;
    const campgroundId = await this.lookupCampgroundIdByStripeAccount(dispute.account);
    return (this.prisma as any).dispute.upsert({
      where: { stripeDisputeId: dispute.id },
      update: {
        amountCents: dispute.amount,
        status: (dispute.status as string) ?? "needs_response",
        reason: dispute.reason ?? null,
        evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
        notes: dispute.evidence?.product_description ?? null
      },
      create: {
        stripeDisputeId: dispute.id,
        stripeChargeId: dispute.charge ?? null,
        stripePaymentIntentId: dispute.payment_intent ?? null,
        campgroundId,
        reservationId,
        payoutId: null,
        amountCents: dispute.amount,
        currency: dispute.currency || 'usd',
        status: (dispute.status as string) ?? "needs_response",
        reason: dispute.reason ?? null,
        evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
        notes: dispute.evidence?.product_description ?? null
      }
    });
  }

  async upsertPayoutFromStripe(payout: any) {
    const payoutRecord = await (this.prisma as any).payout.upsert({
      where: { stripePayoutId: payout.id },
      update: {
        amountCents: payout.amount,
        feeCents: payout.fee,
        status: (payout.status as string) ?? "pending",
        arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
        paidAt: payout.status === 'paid' && payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
        statementDescriptor: payout.statement_descriptor ?? null
      },
      create: {
        stripePayoutId: payout.id,
        stripeAccountId: payout.destination || payout.stripe_account || '',
        campgroundId: await this.lookupCampgroundIdByStripeAccount(payout.destination || payout.stripe_account),
        amountCents: payout.amount,
        feeCents: payout.fee,
        currency: payout.currency || 'usd',
        status: (payout.status as string) ?? "pending",
        arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
        paidAt: payout.status === 'paid' && payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
        statementDescriptor: payout.statement_descriptor ?? null
      }
    });
    return payoutRecord;
  }

  async ingestPayoutTransactions(payout: any, payoutRecord: any) {
    const stripeAccountId = payout.destination || payout.stripe_account;
    if (!stripeAccountId) return;

    const txns = await this.stripeService.listBalanceTransactionsForPayout(payout.id, stripeAccountId);
    for (const tx of txns.data) {
      const chargeId = tx.source as any;
      const payment = chargeId
        ? await (this.prisma as any).payment.findFirst({
            where: { stripeChargeId: chargeId },
            select: { reservationId: true, campgroundId: true }
          } as any)
        : null;
      const reservationId = payment?.reservationId ?? null;
      const campgroundId = payment?.campgroundId ?? payoutRecord.campgroundId;

      await this.createPayoutLine({
        payoutId: payoutRecord.id,
        type: (tx as any).type,
        amount: tx.amount,
        currency: tx.currency,
        description: `BTX ${tx.id} (${(tx as any).type})`,
        reservationId,
        paymentIntentId: (tx as any).payment_intent ?? null,
        chargeId,
        balanceTransactionId: tx.id
      });

      const createdAt = new Date((tx as any).created * 1000);
      const amountAbs = Math.abs(tx.amount);

      // Stripe processing fees: debit expense, credit cash
      if (tx.fee && tx.fee > 0) {
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "STRIPE_FEES",
          account: "Stripe Fees",
          description: `Stripe fee BTX ${tx.id}`,
          amountCents: tx.fee,
          direction: "debit",
          occurredAt: createdAt
        });
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "CASH",
          account: "Cash",
          description: `Stripe fee BTX ${tx.id} (offset)`,
          amountCents: tx.fee,
          direction: "credit",
          occurredAt: createdAt
        });
      }

      // Chargebacks/disputes: debit chargebacks, credit cash
      const txType = (tx as any).type;
      if (tx.reporting_category === "charge_dispute" || txType === "dispute") {
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "CHARGEBACK",
          account: "Chargebacks",
          description: `Chargeback BTX ${tx.id}`,
          amountCents: amountAbs,
          direction: "debit",
          occurredAt: createdAt
        });
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "CASH",
          account: "Cash",
          description: `Chargeback BTX ${tx.id} (offset)`,
          amountCents: amountAbs,
          direction: "credit",
          occurredAt: createdAt
        });
      }

      // Platform/application fees withheld from payout (treat as expense for tie-out)
      if (txType === "application_fee" || tx.reporting_category === "fee") {
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "PLATFORM_FEE",
          account: "Platform Fees",
          description: `Platform fee BTX ${tx.id}`,
          amountCents: amountAbs,
          direction: "debit",
          occurredAt: createdAt
        });
        await this.createLedgerEntryOnce({
          campgroundId,
          reservationId,
          glCode: "CASH",
          account: "Cash",
          description: `Platform fee BTX ${tx.id} (offset)`,
          amountCents: amountAbs,
          direction: "credit",
          occurredAt: createdAt
        });
      }
    }
  }

  async reconcilePayout(payout: any) {
    const payoutRecord = await this.upsertPayoutFromStripe(payout);
    await this.ingestPayoutTransactions(payout, payoutRecord);
    return this.computeReconSummary(payoutRecord.id, payoutRecord.campgroundId);
  }

  async computeReconSummary(payoutId: string, campgroundId: string) {
    const payout = await (this.prisma as any).payout.findFirst({
      where: { id: payoutId, campgroundId },
      include: { lines: true }
    });
    if (!payout) throw new Error("Payout not found");

    const lineSum = (payout.lines || []).reduce((acc: number, l: any) => acc + l.amountCents, 0);
    const reservationIds = Array.from(new Set((payout.lines || []).map((l: any) => l.reservationId).filter(Boolean)));

    let ledgerNet = 0;
    if (reservationIds.length > 0) {
      const ledgerEntries = await (this.prisma as any).ledgerEntry.findMany({
        where: { reservationId: { in: reservationIds } }
      });
      ledgerNet = ledgerEntries.reduce((acc: number, e: any) => acc + (e.direction === "credit" ? e.amountCents : -e.amountCents), 0);
    }

    const payoutNet = (payout.amountCents ?? 0) - (payout.feeCents ?? 0);
    const driftVsLines = payoutNet - lineSum;
    const driftVsLedger = payoutNet - ledgerNet;

    const driftThreshold = Number(process.env.PAYOUT_DRIFT_THRESHOLD_CENTS ?? 100);
    if (Math.abs(driftVsLedger) > driftThreshold) {
      await this.sendAlert(
        `Payout drift detected: payout ${payout.stripePayoutId} camp ${campgroundId} drift_vs_ledger=${driftVsLedger} cents`
      );
    }

    return {
      payoutId,
      campgroundId,
      payoutAmountCents: payout.amountCents,
      payoutFeeCents: payout.feeCents ?? 0,
      payoutNetCents: payoutNet,
      lineSumCents: lineSum,
      ledgerNetCents: ledgerNet,
      driftVsLinesCents: driftVsLines,
      driftVsLedgerCents: driftVsLedger,
    };
  }

  async reconcileRecentPayouts(stripeAccountId: string, sinceSeconds: number = 7 * 24 * 3600) {
    const payouts = await this.stripeService.listPayouts(stripeAccountId, sinceSeconds);
    const results = [];
    for (const p of payouts.data) {
      try {
        const summary = await this.reconcilePayout(p);
        if (Math.abs(summary.driftVsLedgerCents) > 0) {
          this.logger.warn(`Payout ${p.id} drift detected: ${summary.driftVsLedgerCents} cents`);
          await this.sendAlert(
            `Payout drift detected: payout ${p.id} drift_vs_ledger=${summary.driftVsLedgerCents} cents`
          );
        }
        results.push(summary);
      } catch (err) {
        this.logger.warn(`Failed recon for payout ${p.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
    return results;
  }
}

