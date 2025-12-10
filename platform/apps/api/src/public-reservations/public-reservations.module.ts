import { Module } from "@nestjs/common";
import { PublicReservationsController } from "./public-reservations.controller";
import { PublicReservationsService } from "./public-reservations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { PromotionsModule } from "../promotions/promotions.module";
import { AbandonedCartModule } from "../abandoned-cart/abandoned-cart.module";
import { MembershipsModule } from "../memberships/memberships.module";

@Module({
    imports: [PrismaModule, RedisModule, PromotionsModule, AbandonedCartModule, MembershipsModule],
    controllers: [PublicReservationsController],
    providers: [PublicReservationsService]
})
export class PublicReservationsModule { }

