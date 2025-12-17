import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OrgBillingService } from "./org-billing.service";
import { OrgBillingController } from "./org-billing.controller";

@Module({
  imports: [PrismaModule],
  providers: [OrgBillingService],
  controllers: [OrgBillingController],
  exports: [OrgBillingService],
})
export class OrgBillingModule {}
