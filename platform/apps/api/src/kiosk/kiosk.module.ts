import { Module } from "@nestjs/common";
import { KioskController } from "./kiosk.controller";
import { KioskService } from "./kiosk.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [KioskController],
  providers: [KioskService],
  exports: [KioskService],
})
export class KioskModule {}
