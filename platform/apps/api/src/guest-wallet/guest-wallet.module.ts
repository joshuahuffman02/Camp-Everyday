import { Module } from "@nestjs/common";
import { GuestWalletService } from "./guest-wallet.service";
import { GuestWalletController } from "./guest-wallet.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { IdempotencyModule } from "../idempotency/idempotency.module";

@Module({
  imports: [PrismaModule, IdempotencyModule],
  controllers: [GuestWalletController],
  providers: [GuestWalletService],
  exports: [GuestWalletService],
})
export class GuestWalletModule {}
