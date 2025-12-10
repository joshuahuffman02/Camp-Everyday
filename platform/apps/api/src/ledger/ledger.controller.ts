import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import { LedgerService } from "./ledger.service";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class LedgerController {
  constructor(private readonly ledger: LedgerService) { }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Get("campgrounds/:campgroundId/ledger")
  async list(
    @Param("campgroundId") campgroundId: string,
    @Query("start") start?: string,
    @Query("end") end?: string,
    @Query("glCode") glCode?: string
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.ledger.list(campgroundId, startDate, endDate, glCode);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Get("campgrounds/:campgroundId/ledger/export")
  async exportCsv(
    @Param("campgroundId") campgroundId: string,
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("glCode") glCode: string,
    @Res() res: Response
  ) {
    const rows = await this.ledger.list(
      campgroundId,
      start ? new Date(start) : undefined,
      end ? new Date(end) : undefined,
      glCode || undefined
    );
    const headers = ["date", "glCode", "account", "reservationId", "amountCents", "direction", "description"];
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          [
            r.occurredAt.toISOString(),
            r.glCode ?? "",
            r.account ?? "",
            r.reservationId ?? "",
            r.amountCents,
            r.direction,
            (r.description ?? "").replace(/,/g, ";")
          ].join(",")
        )
      )
      .join("\n");
    (res as any).setHeader("Content-Type", "text/csv");
    (res as any).setHeader("Content-Disposition", "attachment; filename=ledger.csv");
    return (res as any).send(csv);
  }

  @Get("reservations/:id/ledger")
  listByReservation(@Param("id") reservationId: string) {
    return this.ledger.listByReservation(reservationId);
  }

  @Get("campgrounds/:campgroundId/ledger/summary")
  summary(
    @Param("campgroundId") campgroundId: string,
    @Query("start") start?: string,
    @Query("end") end?: string
  ) {
    return this.ledger.summaryByGl(campgroundId, start ? new Date(start) : undefined, end ? new Date(end) : undefined);
  }
}
