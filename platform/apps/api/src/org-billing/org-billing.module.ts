import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";
import { EmailModule } from "../email/email.module";
import { OrgBillingService } from "./org-billing.service";
import { OrgBillingController } from "./org-billing.controller";
import { OrgBillingWebhookController } from "./org-billing-webhook.controller";
import { SubscriptionService } from "./subscription.service";

@Module({
  imports: [PrismaModule, PaymentsModule, EmailModule],
  providers: [OrgBillingService, SubscriptionService],
  controllers: [OrgBillingController, OrgBillingWebhookController],
  exports: [OrgBillingService, SubscriptionService],
})
export class OrgBillingModule {}
