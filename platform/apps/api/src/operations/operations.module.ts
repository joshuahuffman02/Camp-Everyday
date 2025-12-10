import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
    imports: [PrismaModule, GamificationModule, PermissionsModule],
    controllers: [OperationsController],
    providers: [OperationsService],
    exports: [OperationsService],
})
export class OperationsModule { }
