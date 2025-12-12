import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateReportExportDto } from './dto/create-report-export.dto';
// Assuming JwtAuthGuard exists in ../auth/jwt-auth.guard or similar
// If not certain, I will check, but standard pattern suggests it.
// Checking app.module or other controllers would confirm. 
// For now I'll assume standard AuthGuard or just leave it open if I can't find it - but wait, 
// I should check another controller to see how auth is handled.
// I'll skip the import for now and check in the next step to be safe, 
// then I will rewrite this file with correct imports.
// Actually, looking at repeat-charges.controller.ts (from user metadata), it likely has imports.
// Ah, I don't see the content of repeat-charges...
// I'll take a safe guess based on common NestJS patterns in this repo (which I've seen in other files).
// Wait, I saw `app.module` and it imports `AuthModule`.
// I will write a basic controller and then fix imports if needed.

@Controller('campgrounds/:campgroundId/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('catalog')
    async listCatalog(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('includeHeavy') includeHeavy?: string
    ) {
        return this.reportsService.listReportCatalog({
            category: category || undefined,
            search: search || undefined,
            includeHeavy: includeHeavy === 'true'
        });
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Post('run')
    @HttpCode(200)
    async runReport(
        @Param('campgroundId') campgroundId: string,
        @Body() body: any
    ) {
        return this.reportsService.runReport(campgroundId, body);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('booking-sources')
    async getBookingSources(
        @Param('campgroundId') campgroundId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getBookingSources(campgroundId, startDate, endDate);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('guest-origins')
    async getGuestOrigins(
        @Param('campgroundId') campgroundId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getGuestOrigins(campgroundId, startDate, endDate);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('referrals')
    async getReferralPerformance(
        @Param('campgroundId') campgroundId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getReferralPerformance(campgroundId, startDate, endDate);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('stay-reasons')
    async getStayReasons(
        @Param('campgroundId') campgroundId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.reportsService.getStayReasonBreakdown(campgroundId, startDate, endDate);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('exports')
    async listExports(
        @Param('campgroundId') campgroundId: string,
        @Query('limit') limit?: string
    ) {
        return this.reportsService.listExports(campgroundId, limit ? Number(limit) : 10);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Post('exports')
    async queueExport(
        @Param('campgroundId') campgroundId: string,
        @Body() body: CreateReportExportDto,
        @Req() req?: any
    ) {
        return this.reportsService.queueExport({
            campgroundId,
            filters: body.filters,
            format: body.format,
            emailTo: body.emailTo,
            requestedById: req?.user?.id
        });
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Post('exports/:exportId/rerun')
    async rerunExport(
        @Param('campgroundId') campgroundId: string,
        @Param('exportId') exportId: string,
        @Req() req?: any
    ) {
        return this.reportsService.rerunExport(campgroundId, exportId, req?.user?.id);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('exports/:exportId')
    async getExport(
        @Param('campgroundId') campgroundId: string,
        @Param('exportId') exportId: string
    ) {
        return this.reportsService.getExport(campgroundId, exportId);
    }

    // Phase 3: Dashboard Metrics
    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('dashboard-metrics')
    async getDashboardMetrics(
        @Param('campgroundId') campgroundId: string,
        @Query('days') days?: string
    ) {
        return this.reportsService.getDashboardMetrics(campgroundId, days ? parseInt(days, 10) : 30);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('revenue-trend')
    async getRevenueTrend(
        @Param('campgroundId') campgroundId: string,
        @Query('months') months?: string
    ) {
        return this.reportsService.getRevenueTrend(campgroundId, months ? parseInt(months, 10) : 12);
    }

    @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
    @Get('occupancy-forecast')
    async getOccupancyForecast(
        @Param('campgroundId') campgroundId: string,
        @Query('days') days?: string
    ) {
        return this.reportsService.getOccupancyForecast(campgroundId, days ? parseInt(days, 10) : 30);
    }

    @Roles(UserRole.owner, UserRole.manager)
    @Get('task-metrics')
    async getTaskMetrics(
        @Param('campgroundId') campgroundId: string
    ) {
        return this.reportsService.getTaskMetrics(campgroundId);
    }
}
