import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  list(campgroundId: string, start?: Date, end?: Date, glCode?: string) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        campgroundId,
        glCode: glCode || undefined,
        ...(start || end
          ? {
              occurredAt: {
                gte: start,
                lte: end
              }
            }
          : {})
      },
      orderBy: { occurredAt: "desc" }
    });
  }

  listByReservation(reservationId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { reservationId },
      orderBy: { occurredAt: "desc" }
    });
  }

  async summaryByGl(campgroundId: string, start?: Date, end?: Date) {
    const rows = await this.list(campgroundId, start, end);
    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = r.glCode || "Unassigned";
      const sign = r.direction === "credit" ? 1 : -1;
      map[key] = (map[key] || 0) + sign * r.amountCents;
    }
    return Object.entries(map).map(([glCode, netCents]) => ({ glCode, netCents }));
  }
}
