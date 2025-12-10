import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { ReservationsModule } from "../reservations/reservations.module";
import { StripeService } from "./stripe.service";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsReconciliationService } from "./reconciliation.service";
import { PaymentsScheduler } from "./payments.scheduler";
import { PermissionsModule } from "../permissions/permissions.module";
import { IdempotencyService } from "./idempotency.service";

@Module({
  imports: [ReservationsModule, PermissionsModule],
  controllers: [PaymentsController],
  providers: [StripeService, PrismaService, PaymentsReconciliationService, PaymentsScheduler, IdempotencyService],
  exports: [StripeService, PaymentsReconciliationService, IdempotencyService]
})
export class PaymentsModule { }

