import { Module } from "@nestjs/common";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";
import { PrismaService } from "../prisma/prisma.service";
import { QuickBooksModule } from "./quickbooks/quickbooks.module";

@Module({
  imports: [QuickBooksModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [QuickBooksModule],
})
export class IntegrationsModule { }

