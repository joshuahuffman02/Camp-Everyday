import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { InternalConversationsService } from './internal-conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from "express";

interface AuthenticatedRequest extends Request {
    user: { id: string; email: string };
}

@Controller('internal-conversations')
@UseGuards(JwtAuthGuard)
export class InternalConversationsController {
    constructor(private readonly service: InternalConversationsService) { }

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() body: { name?: string; type: 'channel' | 'dm'; participantIds: string[]; campgroundId: string }) {
        if (body.type === 'channel') {
            // Ensure current user is in participants for Channel too, usually
            const participants = [...new Set([...body.participantIds, req.user.id])];
            return this.service.createChannel(body.name || 'New Channel', body.campgroundId, participants);
        } else {
            // Ensure current user is in participants for DM
            const participants = [...new Set([...body.participantIds, req.user.id])];
            return this.service.createDM(body.campgroundId, participants);
        }
    }

    @Get()
    findAll(@Req() req: AuthenticatedRequest, @Query('campgroundId') campgroundId: string) {
        return this.service.findAll(req.user.id, campgroundId);
    }
}
