import { Module } from "@nestjs/common";
import { QuickBooksService } from "./quickbooks.service";
import { QuickBooksController } from "./quickbooks.controller";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [QuickBooksController],
  providers: [QuickBooksService, PrismaService],
  exports: [QuickBooksService],
})
export class QuickBooksModule {}
