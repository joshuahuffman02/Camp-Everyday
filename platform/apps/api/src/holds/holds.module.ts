import { Module } from "@nestjs/common";
import { HoldsService } from "./holds.service";
import { HoldsController } from "./holds.controller";
import { PrismaService } from "../prisma/prisma.service";
import { WaitlistModule } from "../waitlist/waitlist.module";

@Module({
  imports: [WaitlistModule],
  controllers: [HoldsController],
  providers: [HoldsService, PrismaService],
  exports: [HoldsService]
})
export class HoldsModule { }


