import { Module } from '@nestjs/common';
import { SelfCheckinController } from './self-checkin.controller';
import { SelfCheckinService } from './self-checkin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SelfCheckinController],
  providers: [SelfCheckinService],
  exports: [SelfCheckinService],
})
export class SelfCheckinModule {}

