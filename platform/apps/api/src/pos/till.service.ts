import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CloseTillDto, OpenTillDto, TillMovementDto, ListTillsDto } from "./till.dto";
import { TillMovementType, TillSessionStatus } from "@prisma/client";

type Actor = { id?: string; campgroundId?: string };

@Injectable()
export class TillService {
  constructor(private readonly prisma: PrismaService) {}

  async open(dto: OpenTillDto, actor: Actor) {
    if (!actor?.campgroundId || !actor?.id) throw new BadRequestException("Missing actor context");

    const existing = await this.prisma.tillSession.findFirst({
      where: {
        campgroundId: actor.campgroundId,
        terminalId: dto.terminalId ?? undefined,
        status: TillSessionStatus.open
      }
    });
    if (existing) throw new BadRequestException("A till is already open for this terminal");

    return this.prisma.tillSession.create({
      data: {
        campgroundId: actor.campgroundId,
        terminalId: dto.terminalId,
        openingFloatCents: dto.openingFloatCents,
        currency: dto.currency,
        notes: dto.notes,
        openedByUserId: actor.id
      }
    });
  }

  async get(id: string, actor: Actor) {
    if (!actor?.campgroundId) throw new BadRequestException("Missing actor context");
    const session = await this.prisma.tillSession.findFirst({
      where: { id, campgroundId: actor.campgroundId },
      include: { movements: true, openedBy: true, closedBy: true, terminal: true }
    });
    if (!session) throw new NotFoundException("Till session not found");
    const expected = this.computeExpected(session.openingFloatCents, session.movements);
    return { ...session, computedExpectedCloseCents: expected, overShortCents: session.overShortCents };
  }

  async list(params: ListTillsDto, actor: Actor) {
    if (!actor?.campgroundId) throw new BadRequestException("Missing actor context");
    return this.prisma.tillSession.findMany({
      where: {
        campgroundId: actor.campgroundId,
        status: params.status
      },
      orderBy: { openedAt: "desc" },
      take: 50
    });
  }

  async close(id: string, dto: CloseTillDto, actor: Actor) {
    if (!actor?.campgroundId || !actor?.id) throw new BadRequestException("Missing actor context");
    const session = await this.prisma.tillSession.findFirst({
      where: { id, campgroundId: actor.campgroundId },
      include: { movements: true }
    });
    if (!session) throw new NotFoundException("Till session not found");
    if (session.status === TillSessionStatus.closed) throw new BadRequestException("Till already closed");

    const expected = this.computeExpected(session.openingFloatCents, session.movements);
    const overShort = dto.countedCloseCents - expected;

    return this.prisma.tillSession.update({
      where: { id },
      data: {
        status: TillSessionStatus.closed,
        expectedCloseCents: expected,
        countedCloseCents: dto.countedCloseCents,
        overShortCents: overShort,
        closedAt: new Date(),
        closedByUserId: actor.id,
        notes: dto.notes ?? session.notes
      }
    });
  }

  async paidIn(id: string, dto: TillMovementDto, actor: Actor) {
    return this.recordMovement(id, TillMovementType.paid_in, dto, actor);
  }

  async paidOut(id: string, dto: TillMovementDto, actor: Actor) {
    return this.recordMovement(id, TillMovementType.paid_out, dto, actor);
  }

  async recordCashSale(sessionId: string, amountCents: number, currency: string, cartId: string | null, actor: Actor) {
    return this.recordMovement(
      sessionId,
      TillMovementType.cash_sale,
      { amountCents, note: cartId ? `cart:${cartId}` : undefined },
      actor,
      currency,
      cartId ?? undefined
    );
  }

  async recordCashRefund(sessionId: string, amountCents: number, currency: string, cartId: string | null, actor: Actor) {
    return this.recordMovement(
      sessionId,
      TillMovementType.cash_refund,
      { amountCents, note: cartId ? `cart:${cartId}` : undefined },
      actor,
      currency,
      cartId ?? undefined
    );
  }

  async findOpenSessionForTerminal(campgroundId: string | null | undefined, terminalId?: string | null) {
    if (!campgroundId) return null;
    return this.prisma.tillSession.findFirst({
      where: { campgroundId, terminalId: terminalId ?? undefined, status: TillSessionStatus.open }
    });
  }

  private async recordMovement(
    sessionId: string,
    type: TillMovementType,
    dto: TillMovementDto,
    actor: Actor,
    currencyOverride?: string,
    sourceCartId?: string
  ) {
    if (!actor?.id) throw new BadRequestException("Missing actor context");
    const session = await this.prisma.tillSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException("Till session not found");
    if (session.status !== TillSessionStatus.open) throw new BadRequestException("Till is not open");
    const currency = currencyOverride ?? session.currency;
    if (currency.toLowerCase() !== session.currency.toLowerCase()) {
      throw new BadRequestException("Till currency mismatch");
    }

    return this.prisma.tillMovement.create({
      data: {
        sessionId,
        type,
        amountCents: dto.amountCents,
        currency,
        actorUserId: actor.id,
        note: dto.note,
        sourceCartId
      }
    });
  }

  private computeExpected(openingFloat: number, movements: { type: TillMovementType; amountCents: number }[]) {
    let expected = openingFloat;
    for (const m of movements) {
      switch (m.type) {
        case TillMovementType.cash_sale:
        case TillMovementType.paid_in:
        case TillMovementType.adjustment:
          expected += m.amountCents;
          break;
        case TillMovementType.cash_refund:
        case TillMovementType.paid_out:
          expected -= m.amountCents;
          break;
      }
    }
    return expected;
  }
}
