import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogService } from "./audit-log.service";
import { AuditLogController } from "./audit-log.controller";
import { FeatureFlagService } from "./feature-flag.service";
import { FeatureFlagController } from "./feature-flag.controller";
import { AnnouncementService } from "./announcement.service";
import { AnnouncementController } from "./announcement.controller";

@Module({
    imports: [PrismaModule],
    controllers: [
        AuditLogController,
        FeatureFlagController,
        AnnouncementController,
    ],
    providers: [
        AuditLogService,
        FeatureFlagService,
        AnnouncementService,
    ],
    exports: [
        AuditLogService,
        FeatureFlagService,
        AnnouncementService,
    ],
})
export class AdminModule { }
