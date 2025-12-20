import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SignaturesModule } from "../signatures/signatures.module";
import { PoliciesController } from "./policies.controller";
import { PoliciesService } from "./policies.service";

@Module({
  imports: [PrismaModule, SignaturesModule],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService]
})
export class PoliciesModule {}
