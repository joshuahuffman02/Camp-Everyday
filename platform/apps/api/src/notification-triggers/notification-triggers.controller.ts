import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationTriggersService, TriggerEvent } from './notification-triggers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campgrounds/:campgroundId/notification-triggers')
export class NotificationTriggersController {
  constructor(private readonly service: NotificationTriggersService) {}

  @Roles(UserRole.owner, UserRole.manager)
  @Get()
  list(@Param('campgroundId') campgroundId: string) {
    return this.service.list(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Post()
  create(
    @Param('campgroundId') campgroundId: string,
    @Body() body: {
      event: TriggerEvent;
      channel: 'email' | 'sms' | 'both';
      enabled?: boolean;
      templateId?: string;
      delayMinutes?: number;
      conditions?: Record<string, any>;
    }
  ) {
    return this.service.create(campgroundId, body);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<{
      event: TriggerEvent;
      channel: 'email' | 'sms' | 'both';
      enabled: boolean;
      templateId: string | null;
      delayMinutes: number;
      conditions: Record<string, any> | null;
    }>
  ) {
    return this.service.update(id, body);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

