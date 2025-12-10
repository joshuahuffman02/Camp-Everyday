import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyService } from "../payments/idempotency.service";
import { IssueStoredValueDto, RedeemStoredValueDto, AdjustStoredValueDto } from "./stored-value.dto";
import { IdempotencyStatus, StoredValueDirection, StoredValueStatus } from "@prisma/client";
import crypto from "crypto";

@Injectable()
export class StoredValueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService
  ) {}

  async issue(dto: IssueStoredValueDto, idempotencyKey?: string, actor?: any) {
    const existing = await this.guardIdempotency(idempotencyKey, dto, actor?.campgroundId);
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) return existing.responseJson;
    if (existing?.status === IdempotencyStatus.inflight && existing.createdAt && Date.now() - new Date(existing.createdAt).getTime() < 60000) {
      throw new ConflictException("Request already in progress");
    }

    const campgroundId = actor?.campgroundId ?? null;
    const now = new Date();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const codeValue = dto.code || this.generateCode();
        const pinValue = dto.codeOptions?.pin || this.generatePinIfRequested(dto.codeOptions);

        const account = await tx.storedValueAccount.create({
          data: {
            campgroundId: campgroundId ?? dto.tenantId,
            type: dto.type,
            currency: dto.currency.toLowerCase(),
            status: StoredValueStatus.active,
            issuedAt: now,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            createdBy: actor?.id,
            createdVia: "api",
            metadata: dto.metadata
          }
        });

        if (codeValue) {
          await tx.storedValueCode.create({
            data: {
              accountId: account.id,
              code: codeValue,
              pinHash: pinValue ? this.hashPin(pinValue) : undefined
            }
          });
        }

        const before = 0;
        const after = before + dto.amountCents;

        await tx.storedValueLedger.create({
          data: {
            campgroundId: account.campgroundId,
            accountId: account.id,
            direction: StoredValueDirection.issue,
            amountCents: dto.amountCents,
            currency: dto.currency.toLowerCase(),
            beforeBalanceCents: before,
            afterBalanceCents: after,
            referenceType: "stored_value_issue",
            referenceId: account.id,
            idempotencyKey: idempotencyKey ?? `issue-${account.id}-${now.getTime()}`,
            actorType: actor?.role,
            actorId: actor?.id,
            channel: dto.metadata?.channel ?? "staff"
          }
        });

        return {
          accountId: account.id,
          balanceCents: after,
          expiresAt: account.expiresAt,
          code: codeValue,
          pinRequired: Boolean(pinValue),
          pin: dto.codeOptions?.pin ? undefined : pinValue // only return generated pins, never echo provided
        };
      });

      if (idempotencyKey) await this.idempotency.complete(idempotencyKey, result);
      return result;
    } catch (err) {
      if (idempotencyKey) await this.idempotency.fail(idempotencyKey);
      throw err;
    }
  }

  async redeem(dto: RedeemStoredValueDto, idempotencyKey?: string, actor?: any) {
    const existing = await this.guardIdempotency(idempotencyKey, dto, actor?.campgroundId);
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) return existing.responseJson;
    if (existing?.status === IdempotencyStatus.inflight && existing.createdAt && Date.now() - new Date(existing.createdAt).getTime() < 60000) {
      throw new ConflictException("Request already in progress");
    }

    const account = await this.getAccount(dto);
    this.ensureActive(account);
    this.ensureCurrency(account, dto.currency);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const { balanceCents, availableCents } = await this.getBalances(tx, account.id);

        if (!dto.holdOnly && availableCents < dto.amountCents) {
          throw new BadRequestException("Insufficient balance");
        }

        if (dto.holdOnly) {
          const hold = await tx.storedValueHold.create({
            data: {
              accountId: account.id,
              amountCents: dto.amountCents,
              status: "open",
              expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min default
              referenceType: dto.referenceType,
              referenceId: dto.referenceId,
              idempotencyKey: idempotencyKey ?? `hold-${account.id}-${Date.now()}`
            }
          });
          return { accountId: account.id, availableCents: availableCents - dto.amountCents, holdId: hold.id };
        }

        const before = balanceCents;
        const after = before - dto.amountCents;

        await tx.storedValueLedger.create({
          data: {
            campgroundId: account.campgroundId,
            accountId: account.id,
            direction: StoredValueDirection.redeem,
            amountCents: dto.amountCents,
            currency: account.currency,
            beforeBalanceCents: before,
            afterBalanceCents: after,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            idempotencyKey: idempotencyKey ?? `redeem-${account.id}-${Date.now()}`,
            actorType: actor?.role,
            actorId: actor?.id,
            channel: dto.channel ?? "pos"
          }
        });

        return { accountId: account.id, balanceCents: after };
      });

      if (idempotencyKey) await this.idempotency.complete(idempotencyKey, result);
      return result;
    } catch (err) {
      if (idempotencyKey) await this.idempotency.fail(idempotencyKey);
      throw err;
    }
  }

  async captureHold(holdId: string, idempotencyKey?: string, actor?: any) {
    const existing = await this.guardIdempotency(idempotencyKey, { holdId }, actor?.campgroundId);
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) return existing.responseJson;
    if (existing?.status === IdempotencyStatus.inflight && existing.createdAt && Date.now() - new Date(existing.createdAt).getTime() < 60000) {
      throw new ConflictException("Request already in progress");
    }

    const hold = await this.prisma.storedValueHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new NotFoundException("Hold not found");
    if (hold.status !== "open") throw new ConflictException("Hold not open");
    if (hold.expiresAt < new Date()) throw new ConflictException("Hold expired");

    const account = await this.prisma.storedValueAccount.findUnique({ where: { id: hold.accountId } });
    if (!account) throw new NotFoundException("Account not found");
    this.ensureActive(account);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const { balanceCents, availableCents } = await this.getBalances(tx, account.id);
        // hold already counted as open; available excludes it. Capture should not double subtract.
        if (availableCents < 0) throw new BadRequestException("Insufficient available balance");

        const before = balanceCents;
        const after = before - hold.amountCents;

        await tx.storedValueLedger.create({
          data: {
            campgroundId: account.campgroundId,
            accountId: account.id,
            direction: StoredValueDirection.hold_capture,
            amountCents: hold.amountCents,
            currency: account.currency,
            beforeBalanceCents: before,
            afterBalanceCents: after,
            referenceType: hold.referenceType,
            referenceId: hold.referenceId,
            idempotencyKey: idempotencyKey ?? `hold-capture-${hold.id}`,
            actorType: actor?.role,
            actorId: actor?.id
          }
        });

        await tx.storedValueHold.update({
          where: { id: hold.id },
          data: { status: "captured" }
        });

        return { accountId: account.id, balanceCents: after };
      });

      if (idempotencyKey) await this.idempotency.complete(idempotencyKey, result);
      return result;
    } catch (err) {
      if (idempotencyKey) await this.idempotency.fail(idempotencyKey);
      throw err;
    }
  }

  async releaseHold(holdId: string, idempotencyKey?: string, actor?: any) {
    const existing = await this.guardIdempotency(idempotencyKey, { holdId }, actor?.campgroundId);
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) return existing.responseJson;
    if (existing?.status === IdempotencyStatus.inflight && existing.createdAt && Date.now() - new Date(existing.createdAt).getTime() < 60000) {
      throw new ConflictException("Request already in progress");
    }

    const hold = await this.prisma.storedValueHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new NotFoundException("Hold not found");
    if (hold.status !== "open") throw new ConflictException("Hold not open");

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.storedValueHold.update({
          where: { id: hold.id },
          data: { status: "released" }
        });
        return { holdId: hold.id, status: "released" };
      });

      if (idempotencyKey) await this.idempotency.complete(idempotencyKey, result);
      return result;
    } catch (err) {
      if (idempotencyKey) await this.idempotency.fail(idempotencyKey);
      throw err;
    }
  }

  /**
   * Sweep and expire open holds past their TTL.
   */
  async expireOpenHolds(cutoff?: Date) {
    const now = cutoff ?? new Date();
    const expiredIds = await this.prisma.storedValueHold.findMany({
      where: { status: "open", expiresAt: { lt: now } },
      select: { id: true }
    });
    if (!expiredIds.length) return { released: 0 };
    await this.prisma.storedValueHold.updateMany({
      where: { id: { in: expiredIds.map((h) => h.id) } },
      data: { status: "expired" }
    });
    return { released: expiredIds.length };
  }

  /**
   * Sweep expired accounts and move remaining balance to expire ledger, marking account expired.
   */
  async expireBalances(cutoff?: Date) {
    const now = cutoff ?? new Date();
    const accounts = await this.prisma.storedValueAccount.findMany({
      where: { status: StoredValueStatus.active, expiresAt: { not: null, lt: now } },
      select: { id: true, campgroundId: true, currency: true, expiresAt: true }
    });
    if (!accounts.length) return { expired: 0, zeroed: 0 };

    let expiredCount = 0;
    let zeroedCount = 0;

    for (const acc of accounts) {
      await this.prisma.$transaction(async (tx) => {
        const { balanceCents } = await this.getBalances(tx, acc.id);
        if (balanceCents <= 0) {
          await tx.storedValueAccount.update({
            where: { id: acc.id },
            data: { status: StoredValueStatus.expired }
          });
          zeroedCount += 1;
          return;
        }

        await tx.storedValueLedger.create({
          data: {
            campgroundId: acc.campgroundId,
            accountId: acc.id,
            direction: StoredValueDirection.expire,
            amountCents: balanceCents,
            currency: acc.currency,
            beforeBalanceCents: balanceCents,
            afterBalanceCents: 0,
            referenceType: "expire",
            referenceId: acc.id,
            idempotencyKey: `expire-${acc.id}-${now.getTime()}`
          }
        });

        await tx.storedValueAccount.update({
          where: { id: acc.id },
          data: { status: StoredValueStatus.expired }
        });
        expiredCount += 1;
      });
    }

    return { expired: expiredCount, zeroed: zeroedCount };
  }

  async adjust(dto: AdjustStoredValueDto, idempotencyKey?: string, actor?: any) {
    const existing = await this.guardIdempotency(idempotencyKey, dto, actor?.campgroundId);
    if (existing?.status === IdempotencyStatus.succeeded && existing.responseJson) return existing.responseJson;
    if (existing?.status === IdempotencyStatus.inflight && existing.createdAt && Date.now() - new Date(existing.createdAt).getTime() < 60000) {
      throw new ConflictException("Request already in progress");
    }

    const account = await this.prisma.storedValueAccount.findUnique({ where: { id: dto.accountId } });
    if (!account) throw new NotFoundException("Account not found");
    this.ensureActive(account);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const { balanceCents } = await this.getBalances(tx, account.id);
        const after = balanceCents + dto.deltaCents;
        if (after < 0) throw new BadRequestException("Adjustment would result in negative balance");

        await tx.storedValueLedger.create({
          data: {
            campgroundId: account.campgroundId,
            accountId: account.id,
            direction: StoredValueDirection.adjust,
            amountCents: dto.deltaCents,
            currency: account.currency,
            beforeBalanceCents: balanceCents,
            afterBalanceCents: after,
            referenceType: "adjustment",
            referenceId: dto.accountId,
            idempotencyKey: idempotencyKey ?? `adjust-${dto.accountId}-${Date.now()}`,
            actorType: actor?.role,
            actorId: actor?.id,
            reason: dto.reason
          }
        });

        return { accountId: account.id, balanceCents: after };
      });

      if (idempotencyKey) await this.idempotency.complete(idempotencyKey, result);
      return result;
    } catch (err) {
      if (idempotencyKey) await this.idempotency.fail(idempotencyKey);
      throw err;
    }
  }

  async balanceByAccount(accountId: string) {
    // Computes balance from ledger for now
    const { balanceCents, availableCents } = await this.getBalances(this.prisma, accountId);
    return { accountId, balanceCents, availableCents };
  }

  async balanceByCode(code: string) {
    const account = await this.prisma.storedValueCode.findUnique({
      where: { code },
      select: { accountId: true }
    });
    if (!account) return { code, balanceCents: 0 };
    return this.balanceByAccount(account.accountId);
  }

  private directionToSigned(direction: StoredValueDirection, amount: number) {
    if ([StoredValueDirection.issue, StoredValueDirection.refund, StoredValueDirection.adjust].includes(direction)) return amount;
    if ([StoredValueDirection.redeem, StoredValueDirection.expire, StoredValueDirection.hold_capture].includes(direction)) return -Math.abs(amount);
    return 0;
  }

  private async getBalances(tx: any, accountId: string) {
    const ledger = await tx.storedValueLedger.findMany({
      where: { accountId },
      select: { direction: true, amountCents: true }
    });
    const balanceCents = ledger.reduce((sum, row) => sum + this.directionToSigned(row.direction, row.amountCents), 0);
    const openHolds = await tx.storedValueHold.aggregate({
      where: { accountId, status: "open" },
      _sum: { amountCents: true }
    });
    const held = openHolds._sum.amountCents ?? 0;
    return { balanceCents, availableCents: balanceCents - held };
  }

  private async guardIdempotency(key?: string, body?: any, campgroundId?: string | null) {
    if (!key) return null;
    return this.idempotency.start(key, body ?? {}, campgroundId ?? null);
  }

  private ensureActive(account: any) {
    if (account.status !== StoredValueStatus.active) {
      throw new ForbiddenException("Stored value account not active");
    }
    if (account.expiresAt && account.expiresAt < new Date()) {
      throw new ForbiddenException("Stored value account expired");
    }
  }

  private ensureCurrency(account: any, currency: string) {
    if (account.currency !== currency.toLowerCase()) {
      throw new BadRequestException("Currency mismatch");
    }
  }

  private async getAccount(dto: RedeemStoredValueDto) {
    if (!dto.accountId && !dto.code) {
      throw new BadRequestException("accountId or code required");
    }
    if (dto.accountId) {
      const acc = await this.prisma.storedValueAccount.findUnique({ where: { id: dto.accountId } });
      if (!acc) throw new NotFoundException("Account not found");
      return acc;
    }
    const code = await this.prisma.storedValueCode.findUnique({
      where: { code: dto.code! },
      select: {
        pinHash: true,
        account: true
      }
    });
    if (!code?.account) throw new NotFoundException("Account not found");
    if (code.pinHash) {
      if (!dto.pin) throw new ForbiddenException("PIN required");
      if (!this.verifyPin(dto.pin, code.pinHash)) throw new ForbiddenException("Invalid PIN");
    }
    return code.account;
  }

  private hashPin(pin: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(pin, salt, 10000, 32, "sha256").toString("hex");
    return `${salt}:${hash}`;
  }

  private verifyPin(pin: string, stored: string) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = crypto.pbkdf2Sync(pin, salt, 10000, 32, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  }

  private generateCode(length = 16) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(length);
    let code = "";
    for (let i = 0; i < length; i++) {
      code += alphabet[bytes[i] % alphabet.length];
    }
    return code;
  }

  private generatePinIfRequested(codeOptions?: { pin?: string; generatePin?: boolean }) {
    if (codeOptions?.pin) return codeOptions.pin;
    if (!codeOptions?.generatePin) return undefined;
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    return pin;
  }
}
