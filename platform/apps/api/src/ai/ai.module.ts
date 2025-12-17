import { Module } from '@nestjs/common';
import { AiPrivacyService } from './ai-privacy.service';
import { AiProviderService } from './ai-provider.service';
import { AiFeatureGateService } from './ai-feature-gate.service';
import { AiReplyAssistService } from './ai-reply-assist.service';
import { AiInsightsService } from './ai-insights.service';
import { AiBookingAssistService } from './ai-booking-assist.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicReservationsModule } from '../public-reservations/public-reservations.module';

@Module({
  imports: [PrismaModule, PublicReservationsModule],
  controllers: [AiController],
  providers: [
    AiPrivacyService,
    AiProviderService,
    AiFeatureGateService,
    AiReplyAssistService,
    AiInsightsService,
    AiBookingAssistService,
  ],
  exports: [
    AiPrivacyService,
    AiProviderService,
    AiFeatureGateService,
    AiReplyAssistService,
    AiInsightsService,
    AiBookingAssistService,
  ],
})
export class AiModule { }
