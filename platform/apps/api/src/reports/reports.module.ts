import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ObservabilityModule } from "../observability/observability.module";
import { DashboardService } from "../dashboard/dashboard.service";
import { UploadsModule } from "../uploads/uploads.module";
import { AuditModule } from "../audit/audit.module";

@Module({
    imports: [PrismaModule, ObservabilityModule, UploadsModule, AuditModule],
    controllers: [ReportsController],
    providers: [ReportsService, DashboardService],
    exports: [ReportsService],
})
export class ReportsModule { }
