import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type RedemptionChannel = "booking" | "pos";

export type GiftCardRecord = {
  code: string;
  balanceCents: number;
  currency?: string;
  kind?: "gift_card" | "store_credit";
};

@Injectable()
export class GiftCardsService {
  private readonly memory = new Map<string, GiftCardRecord>();

  constructor(private readonly prisma: PrismaService) {
    // Seed a couple of stub cards so the endpoints work even without a database row.
    this.seedInMemory([
      { code: "CAMP-WELCOME-100", balanceCents: 10000, kind: "gift_card" },
      { code: "STORE-RETURN-50", balanceCents: 5000, kind: "store_credit" }
    ]);
  }

  /**
   * Test/helper hook to reset the in-memory stub state.
   */
  seedInMemory(cards: GiftCardRecord[]) {
    this.memory.clear();
    cards.forEach((card) => this.memory.set(card.code, { currency: "usd", ...card }));
  }

  /**
   * Used by smoke tests to assert balance updates without poking at internals.
   */
  getBalance(code: string) {
    return this.memory.get(code)?.balanceCents ?? null;
  }

  async redeemAgainstBooking(code: string, amountCents: number, bookingId: string) {
    return this.redeem(code, amountCents, { channel: "booking", referenceId: bookingId });
  }

  async redeemAgainstPosOrder(code: string, amountCents: number, orderId: string) {
    return this.redeem(code, amountCents, { channel: "pos", referenceId: orderId });
  }

  private async redeem(
    code: string,
    amountCents: number,
    context: { channel: RedemptionChannel; referenceId: string }
  ) {
    if (!code) throw new BadRequestException("code is required");
    if (!amountCents || amountCents <= 0) throw new BadRequestException("amount must be positive");

    const card = await this.loadCard(code);
    if (!card) throw new NotFoundException("Gift card or store credit not found");
    if (card.balanceCents < amountCents) throw new BadRequestException("Insufficient balance");

    const balanceCents = card.balanceCents - amountCents;
    this.memory.set(code, { ...card, balanceCents });

    const prismaGiftCard = (this.prisma as any)?.giftCard;
    if (prismaGiftCard?.update) {
      await prismaGiftCard.update({
        where: { code },
        data: { balanceCents }
      });
    }

    const prismaTxn = (this.prisma as any)?.giftCardTransaction;
    if (prismaTxn?.create) {
      await prismaTxn.create({
        data: {
          code,
          amountCents,
          channel: context.channel,
          referenceId: context.referenceId
        }
      });
    }

    return {
      code,
      balanceCents,
      redeemedCents: amountCents,
      channel: context.channel,
      referenceId: context.referenceId
    };
  }

  private async loadCard(code: string): Promise<GiftCardRecord | null> {
    const fromMemory = this.memory.get(code);
    if (fromMemory) return fromMemory;

    const prismaGiftCard = (this.prisma as any)?.giftCard;
    if (prismaGiftCard?.findUnique) {
      const found = await prismaGiftCard.findUnique({ where: { code } });
      if (found) {
        this.memory.set(code, found);
        return found;
      }
    }

    return null;
  }
}

