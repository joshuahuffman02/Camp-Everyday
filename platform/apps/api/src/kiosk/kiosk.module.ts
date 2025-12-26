import { Module } from "@nestjs/common";
import { KioskController } from "./kiosk.controller";
import { KioskService } from "./kiosk.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PublicReservationsModule } from "../public-reservations/public-reservations.module";

@Module({
  imports: [PrismaModule, PublicReservationsModule],
  controllers: [KioskController],
  providers: [KioskService],
  exports: [KioskService],
})
export class KioskModule {}
