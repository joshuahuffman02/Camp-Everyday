import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SelfCheckinService } from './self-checkin.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('reservations/:id')
export class SelfCheckinController {
  constructor(private readonly selfCheckinService: SelfCheckinService) {}

  @Get('checkin-status')
  getStatus(@Param('id') id: string) {
    return this.selfCheckinService.getStatus(id);
  }

  @Post('self-checkin')
  selfCheckin(
    @Param('id') id: string,
    @Body() body: { lateArrival?: boolean; override?: boolean },
  ) {
    return this.selfCheckinService.selfCheckin(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('self-checkout')
  selfCheckout(
    @Param('id') id: string,
    @Body()
    body: {
      damageNotes?: string;
      damagePhotos?: string[];
      override?: boolean;
    },
  ) {
    return this.selfCheckinService.selfCheckout(id, body);
  }
}

