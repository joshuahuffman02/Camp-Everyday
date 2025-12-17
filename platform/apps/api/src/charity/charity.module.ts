import { Module } from "@nestjs/common";
import { CharityService } from "./charity.service";
import { CharityController, CampgroundCharityController } from "./charity.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CharityController, CampgroundCharityController],
  providers: [CharityService],
  exports: [CharityService],
})
export class CharityModule {}
