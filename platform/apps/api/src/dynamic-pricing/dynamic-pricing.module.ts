import { Module } from '@nestjs/common';
import { DynamicPricingService } from './dynamic-pricing.service';
import { DynamicPricingController } from './dynamic-pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DynamicPricingController],
  providers: [DynamicPricingService],
  exports: [DynamicPricingService],
})
export class DynamicPricingModule {}

