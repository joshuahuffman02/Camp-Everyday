import { Module } from "@nestjs/common";
import { AccountingConfidenceService } from "./accounting-confidence.service";
import { AccountingConfidenceController } from "./accounting-confidence.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  imports: [],
  controllers: [AccountingConfidenceController],
  providers: [AccountingConfidenceService, PrismaService],
  exports: [AccountingConfidenceService],
})
export class AccountingModule {}
