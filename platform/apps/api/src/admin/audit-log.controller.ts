import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards";
import { UserRole } from "@prisma/client";
import { AuditLogService } from "./audit-log.service";

@Controller("admin/audit")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
    constructor(private readonly auditLog: AuditLogService) { }

    @Get()
    @Roles(UserRole.platform_admin, UserRole.support_agent, UserRole.support_lead)
    async list(
        @Query("limit") limit?: string,
        @Query("offset") offset?: string,
        @Query("action") action?: string,
        @Query("resource") resource?: string,
        @Query("userId") userId?: string,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string
    ) {
        return this.auditLog.findAll({
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
            action,
            resource,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
}
