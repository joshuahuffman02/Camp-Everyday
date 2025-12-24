import { Module } from "@nestjs/common";
import { GuestWalletService } from "./guest-wallet.service";
import { GuestWalletController } from "./guest-wallet.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [GuestWalletController],
  providers: [GuestWalletService],
  exports: [GuestWalletService],
})
export class GuestWalletModule {}
