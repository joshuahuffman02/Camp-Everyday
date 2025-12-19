import { Module, forwardRef } from '@nestjs/common';
import { AiPrivacyService } from './ai-privacy.service';
import { AiProviderService } from './ai-provider.service';
import { AiFeatureGateService } from './ai-feature-gate.service';
import { AiReplyAssistService } from './ai-reply-assist.service';
import { AiInsightsService } from './ai-insights.service';
import { AiBookingAssistService } from './ai-booking-assist.service';
import { AiSupportService } from './ai-support.service';
import { AiPartnerService } from './ai-partner.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicReservationsModule } from '../public-reservations/public-reservations.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { HoldsModule } from '../holds/holds.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PublicReservationsModule),
    PermissionsModule,
    AuditModule,
    HoldsModule,
  ],
  controllers: [AiController],
  providers: [
    AiPrivacyService,
    AiProviderService,
    AiFeatureGateService,
    AiReplyAssistService,
    AiInsightsService,
    AiBookingAssistService,
    AiSupportService,
    AiPartnerService,
  ],
  exports: [
    AiPrivacyService,
    AiProviderService,
    AiFeatureGateService,
    AiReplyAssistService,
    AiInsightsService,
    AiBookingAssistService,
    AiSupportService,
    AiPartnerService,
  ],
})
export class AiModule { }
