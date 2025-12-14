import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { AuditLogService } from "./audit-log.service";

@Controller("admin/audit")
@UseGuards(JwtAuthGuard)
export class AuditLogController {
    constructor(private readonly auditLog: AuditLogService) { }

    @Get()
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
