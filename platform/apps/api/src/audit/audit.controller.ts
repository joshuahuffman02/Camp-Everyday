import { Controller, Get, Query, UseGuards, Param, Res, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { AuditService } from "./audit.service";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";
import type { Response } from "express";
import { PermissionGuard } from "../permissions/permission.guard";
import { RequirePermission } from "../permissions/permission.decorator";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller("campgrounds/:campgroundId/audit")
export class AuditController {
  constructor(private readonly audit: AuditService) { }

  @Roles(UserRole.owner, UserRole.manager)
  @RequirePermission({ resource: "audit", action: "read" })
  @Get()
  async list(
    @Param("campgroundId") campgroundId: string,
    @Query("action") action?: string,
    @Query("actorId") actorId?: string,
    @Query("start") start?: string,
    @Query("end") end?: string,
    @Query("limit") limit?: string,
    @Query("format") format?: string,
    @Req() req?: any,
    @Res() res?: Response
  ) {
    const params = {
      campgroundId,
      action: action || undefined,
      actorId: actorId || undefined,
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
      limit: limit ? Math.min(Number(limit) || 100, 500) : 200
    };

    if (format === "csv" && res) {
      const rows = await this.audit.list(params, req?.ip, req?.headers?.["user-agent"]);
      await this.audit.recordExport({
        campgroundId,
        requestedById: req?.user?.id,
        format: "csv",
        filters: params,
        recordCount: rows.length
      });
      return this.audit.exportCsv(params, res);
    }

    const rows = await this.audit.exportJson(params);
    await this.audit.recordExport({
      campgroundId,
      requestedById: req?.user?.id,
      format: "json",
      filters: params,
      recordCount: rows.length
    });
    return rows;
  }

  @Roles(UserRole.owner, UserRole.manager)
  @RequirePermission({ resource: "audit", action: "read" })
  @Get("quick")
  quickAudit(@Param("campgroundId") campgroundId: string) {
    return this.audit.quickAudit({ campgroundId, limit: 5 });
  }

  @Roles(UserRole.owner, UserRole.manager)
  @RequirePermission({ resource: "audit", action: "export" })
  @Get("exports")
  listExports(@Param("campgroundId") campgroundId: string) {
    return this.audit.listExports(campgroundId);
  }
}

