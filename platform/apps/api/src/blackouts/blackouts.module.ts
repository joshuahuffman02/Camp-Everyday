import { Module } from "@nestjs/common";
import { BlackoutsService } from "./blackouts.service";
import { BlackoutsController } from "./blackouts.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [BlackoutsController],
    providers: [BlackoutsService],
    exports: [BlackoutsService]
})
export class BlackoutsModule { }
