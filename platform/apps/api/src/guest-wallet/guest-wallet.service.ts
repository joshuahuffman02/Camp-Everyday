import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../payments/idempotency.service";
import {
  IdempotencyStatus,
  StoredValueDirection,
  StoredValueStatus,
  StoredValueType,
} from "@prisma/client";
import {
  AddWalletCreditDto,
  DebitWalletDto,
  TransferToWalletDto,
  WalletBalance,
  WalletCreditResult,
  WalletDebitResult,
  WalletTransaction,
} from "./guest-wallet.dto";

@Injectable()
export class GuestWalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => IdempotencyService))
    private readonly idempotency: IdempotencyService
  ) {}

  /**
   * Get or create a wallet for a guest at a campground
   */
  async getOrCreateWallet(
    campgroundId: string,
    guestId: string,
    currency: string = "usd"
  ): Promise<{ id: string; isNew: boolean }> {
    // Check if wallet already exists
    const existing = await this.prisma.storedValueAccount.findFirst({
      where: {
        campgroundId,
        guestId,
        status: StoredValueStatus.active,
      },
    });

    if (existing) {
      return { id: existing.id, isNew: false };
    }

    // Create new wallet
    const wallet = await this.prisma.storedValueAccount.create({
      data: {
        campgroundId,
        guestId,
        type: StoredValueType.credit, // Guest wallets are always "credit" type
        currency: currency.toLowerCase(),
        status: StoredValueStatus.active,
        issuedAt: new Date(),
        createdVia: "guest_wallet",
        metadata: { isGuestWallet: true },
      },
    });

    return { id: wallet.id, isNew: true };
  }

  /**
   * Find wallet for a guest at a campground
   */
  async findWallet(
    campgroundId: string,
    guestId: string
  ): Promise<{ id: string; currency: string } | null> {
    const wallet = await this.prisma.storedValueAccount.findFirst({
      where: {
        campgroundId,
        guestId,
        status: StoredValueStatus.active,
      },
      select: { id: true, currency: true },
    });

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId: string): Promise<WalletBalance> {
    const wallet = await this.prisma.storedValueAccount.findUnique({
      where: { id: walletId },
      select: {
        id: true,
        guestId: true,
        campgroundId: true,
        currency: true,
        status: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    if (!wallet.guestId) {
      throw new BadRequestException("Not a guest wallet");
    }

    const { balanceCents, availableCents } = await this.computeBalance(walletId);

    return {
      walletId: wallet.id,
      guestId: wallet.guestId,
      campgroundId: wallet.campgroundId,
      balanceCents,
      availableCents,
      currency: wallet.currency,
    };
  }

  /**
   * Get balance for a guest at a campground (creates wallet if needed)
   */
  async getGuestBalance(
    campgroundId: string,
    guestId: string
  ): Promise<WalletBalance> {
    const { id: walletId } = await this.getOrCreateWallet(campgroundId, guestId);
    return this.getBalance(walletId);
  }

  /**
   * Add credit to a guest's wallet (staff action)
   */
  async addCredit(
    campgroundId: string,
    dto: AddWalletCreditDto,
    idempotencyKey?: string,
    actor?: any
  ): Promise<WalletCreditResult> {
    const scope = { campgroundId };
    const key = idempotencyKey ?? `wallet-credit-${dto.guestId}-${Date.now()}`;

    // Check idempotency
    const existing = await this.guardIdempotency(key, dto, scope, "guest-wallet/credit");
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) {
      return existing.responseJson as WalletCreditResult;
    }
    if (
      existing?.status === IdempotencyStatus.inflight &&
      existing.createdAt &&
      Date.now() - new Date(existing.createdAt).getTime() < 60000
    ) {
      throw new ConflictException("Request already in progress");
    }

    const currency = dto.currency?.toLowerCase() ?? "usd";

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Get or create wallet
        let wallet = await tx.storedValueAccount.findFirst({
          where: {
            campgroundId,
            guestId: dto.guestId,
            status: StoredValueStatus.active,
          },
        });

        if (!wallet) {
          wallet = await tx.storedValueAccount.create({
            data: {
              campgroundId,
              guestId: dto.guestId,
              type: StoredValueType.credit,
              currency,
              status: StoredValueStatus.active,
              issuedAt: new Date(),
              createdBy: actor?.id,
              createdVia: "guest_wallet",
              metadata: { isGuestWallet: true },
            },
          });
        }

        // Compute current balance
        const { balanceCents: before } = await this.computeBalanceInTx(tx, wallet.id);
        const after = before + dto.amountCents;

        // Create ledger entry
        const ledgerEntry = await tx.storedValueLedger.create({
          data: {
            campgroundId,
            accountId: wallet.id,
            direction: StoredValueDirection.issue,
            amountCents: dto.amountCents,
            currency,
            beforeBalanceCents: before,
            afterBalanceCents: after,
            referenceType: dto.referenceId ? "external" : "staff_credit",
            referenceId: dto.referenceId ?? wallet.id,
            idempotencyKey: key,
            actorType: actor?.role ?? "staff",
            actorId: actor?.id,
            channel: "staff",
            reason: dto.reason ?? "Staff added credit",
          },
        });

        return {
          walletId: wallet.id,
          balanceCents: after,
          transactionId: ledgerEntry.id,
        };
      });

      // Mark idempotency as succeeded
      await this.completeIdempotency(key, scope, result);

      return result;
    } catch (error) {
      await this.failIdempotency(key, scope, error);
      throw error;
    }
  }

  /**
   * Credit from reservation refund
   */
  async creditFromRefund(
    campgroundId: string,
    reservationId: string,
    guestId: string,
    amountCents: number,
    reason: string,
    idempotencyKey?: string,
    actor?: any
  ): Promise<WalletCreditResult> {
    const key = idempotencyKey ?? `wallet-refund-${reservationId}-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      // Get or create wallet
      let wallet = await tx.storedValueAccount.findFirst({
        where: {
          campgroundId,
          guestId,
          status: StoredValueStatus.active,
        },
      });

      if (!wallet) {
        wallet = await tx.storedValueAccount.create({
          data: {
            campgroundId,
            guestId,
            type: StoredValueType.credit,
            currency: "usd",
            status: StoredValueStatus.active,
            issuedAt: new Date(),
            createdVia: "refund_to_wallet",
            metadata: { isGuestWallet: true },
          },
        });
      }

      const { balanceCents: before } = await this.computeBalanceInTx(tx, wallet.id);
      const after = before + amountCents;

      const ledgerEntry = await tx.storedValueLedger.create({
        data: {
          campgroundId,
          accountId: wallet.id,
          direction: StoredValueDirection.refund,
          amountCents,
          currency: wallet.currency,
          beforeBalanceCents: before,
          afterBalanceCents: after,
          referenceType: "reservation",
          referenceId: reservationId,
          idempotencyKey: key,
          actorType: actor?.role ?? "system",
          actorId: actor?.id,
          channel: "refund",
          reason,
        },
      });

      return {
        walletId: wallet.id,
        balanceCents: after,
        transactionId: ledgerEntry.id,
      };
    });
  }

  /**
   * Debit wallet for payment (POS or reservation)
   */
  async debitForPayment(
    campgroundId: string,
    dto: DebitWalletDto,
    idempotencyKey?: string,
    actor?: any
  ): Promise<WalletDebitResult> {
    const key = idempotencyKey ?? `wallet-debit-${dto.referenceId}-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.storedValueAccount.findFirst({
        where: {
          campgroundId,
          guestId: dto.guestId,
          status: StoredValueStatus.active,
        },
      });

      if (!wallet) {
        throw new NotFoundException("Guest wallet not found");
      }

      const { balanceCents, availableCents } = await this.computeBalanceInTx(
        tx,
        wallet.id
      );

      if (availableCents < dto.amountCents) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ${availableCents}, requested: ${dto.amountCents}`
        );
      }

      const after = balanceCents - dto.amountCents;

      const ledgerEntry = await tx.storedValueLedger.create({
        data: {
          campgroundId,
          accountId: wallet.id,
          direction: StoredValueDirection.redeem,
          amountCents: dto.amountCents,
          currency: wallet.currency,
          beforeBalanceCents: balanceCents,
          afterBalanceCents: after,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          idempotencyKey: key,
          actorType: actor?.role ?? "system",
          actorId: actor?.id,
          channel: dto.referenceType === "pos_cart" ? "pos" : "web",
          reason: `Payment for ${dto.referenceType}`,
        },
      });

      return {
        walletId: wallet.id,
        balanceCents: after,
        transactionId: ledgerEntry.id,
      };
    });
  }

  /**
   * List transactions for a wallet
   */
  async listTransactions(
    walletId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.prisma.storedValueLedger.findMany({
        where: { accountId: walletId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          direction: true,
          amountCents: true,
          beforeBalanceCents: true,
          afterBalanceCents: true,
          referenceType: true,
          referenceId: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.storedValueLedger.count({
        where: { accountId: walletId },
      }),
    ]);

    return { transactions, total };
  }

  /**
   * Get all wallets for a guest (across campgrounds)
   */
  async getGuestWallets(guestId: string): Promise<WalletBalance[]> {
    const wallets = await this.prisma.storedValueAccount.findMany({
      where: {
        guestId,
        status: StoredValueStatus.active,
      },
      include: {
        campground: { select: { name: true, slug: true } },
      },
    });

    const balances = await Promise.all(
      wallets.map(async (wallet) => {
        const { balanceCents, availableCents } = await this.computeBalance(wallet.id);
        return {
          walletId: wallet.id,
          guestId: wallet.guestId!,
          campgroundId: wallet.campgroundId,
          balanceCents,
          availableCents,
          currency: wallet.currency,
          campgroundName: wallet.campground.name,
          campgroundSlug: wallet.campground.slug,
        };
      })
    );

    return balances;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async computeBalance(accountId: string): Promise<{
    balanceCents: number;
    availableCents: number;
  }> {
    const ledger = await this.prisma.storedValueLedger.findMany({
      where: { accountId },
      select: { direction: true, amountCents: true },
    });

    const balanceCents = ledger.reduce(
      (sum, row) => sum + this.directionToSigned(row.direction, row.amountCents),
      0
    );

    const openHolds = await this.prisma.storedValueHold.aggregate({
      where: { accountId, status: "open" },
      _sum: { amountCents: true },
    });

    const held = openHolds._sum.amountCents ?? 0;

    return { balanceCents, availableCents: balanceCents - held };
  }

  private async computeBalanceInTx(
    tx: any,
    accountId: string
  ): Promise<{ balanceCents: number; availableCents: number }> {
    const ledger = await tx.storedValueLedger.findMany({
      where: { accountId },
      select: { direction: true, amountCents: true },
    });

    const balanceCents = ledger.reduce(
      (sum: number, row: any) =>
        sum + this.directionToSigned(row.direction, row.amountCents),
      0
    );

    const openHolds = await tx.storedValueHold.aggregate({
      where: { accountId, status: "open" },
      _sum: { amountCents: true },
    });

    const held = openHolds._sum.amountCents ?? 0;

    return { balanceCents, availableCents: balanceCents - held };
  }

  private directionToSigned(direction: StoredValueDirection, amount: number): number {
    // Positive directions (add to balance)
    if (
      [
        StoredValueDirection.issue,
        StoredValueDirection.refund,
        StoredValueDirection.adjust,
      ].includes(direction)
    ) {
      return amount;
    }
    // Negative directions (subtract from balance)
    if (
      [
        StoredValueDirection.redeem,
        StoredValueDirection.expire,
        StoredValueDirection.hold_capture,
      ].includes(direction)
    ) {
      return -Math.abs(amount);
    }
    return 0;
  }

  private async guardIdempotency(
    key: string | undefined,
    payload: any,
    scope: any,
    operation: string
  ) {
    if (!key) return null;
    try {
      return await this.idempotency.getOrCreate(key, payload, scope, operation);
    } catch {
      return null;
    }
  }

  private async completeIdempotency(key: string, scope: any, result: any) {
    try {
      await this.idempotency.complete(key, scope, result);
    } catch {
      // Ignore errors
    }
  }

  private async failIdempotency(key: string, scope: any, error: any) {
    try {
      await this.idempotency.fail(key, scope, error?.message ?? "Unknown error");
    } catch {
      // Ignore errors
    }
  }
}
