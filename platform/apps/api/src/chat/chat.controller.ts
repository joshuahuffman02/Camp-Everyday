import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  Logger,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from "express";
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { UploadsService } from '../uploads/uploads.service';
import { SendMessageDto, ChatMessageResponse } from './dto/send-message.dto';
import { ExecuteActionDto, ExecuteActionResponse } from './dto/execute-action.dto';
import { GetHistoryDto, ConversationHistoryResponse } from './dto/get-history.dto';
import { GetConversationsDto, ConversationListResponse } from './dto/get-conversations.dto';
import { SubmitFeedbackDto, SubmitFeedbackResponse } from './dto/submit-feedback.dto';
import { RegenerateMessageDto } from './dto/regenerate-message.dto';
import { SignChatAttachmentDto, SignChatAttachmentResponse } from './dto/sign-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { ChatParticipantType, Guest } from '@prisma/client';
import type { AuthUser } from "../auth/auth.types";
import * as path from "path";

// Types for authenticated staff requests
type StaffAuthenticatedRequest = Omit<ExpressRequest, "user"> & { user: AuthUser };

// Types for authenticated guest requests
type GuestAuthenticatedRequest = Omit<ExpressRequest, "user"> & { user: Guest };

const CHAT_ATTACHMENT_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
const CHAT_ATTACHMENT_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly uploads: UploadsService,
  ) {}

  /**
   * Get staff role for campground from memberships
   */
  private getStaffRole(req: StaffAuthenticatedRequest, campgroundId: string): string | undefined {
    const membership = req.user.memberships?.find(m => m.campgroundId === campgroundId);
    return membership?.role ?? req.user.role ?? undefined;
  }

  private validateAttachmentPayload(dto: SignChatAttachmentDto) {
    if (dto.size > CHAT_ATTACHMENT_MAX_BYTES) {
      throw new BadRequestException("Attachment too large");
    }

    const ext = path.extname(dto.filename).toLowerCase();
    if (!CHAT_ATTACHMENT_ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException("Attachment type not allowed");
    }

    if (!CHAT_ATTACHMENT_ALLOWED_CONTENT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException("Attachment content type not allowed");
    }

    const extensionContentTypeMap: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.pdf': ['application/pdf'],
    };
    const allowedTypesForExt = extensionContentTypeMap[ext] ?? [];
    if (!allowedTypesForExt.includes(dto.contentType)) {
      throw new BadRequestException("Attachment content type does not match file extension");
    }
  }

  /**
   * Staff chat endpoint
   * POST /campgrounds/:campgroundId/chat/message
   */
  @Post('/campgrounds/:campgroundId/message')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 messages per minute for staff
  @HttpCode(HttpStatus.OK)
  async sendStaffMessage(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SendMessageDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<ChatMessageResponse> {
    this.logger.log(`Staff chat message from user ${req.user.id}`);

    return this.chatService.sendMessage(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Staff chat streaming endpoint (uses WebSocket for response)
   * POST /campgrounds/:campgroundId/chat/message/stream
   */
  @Post('/campgrounds/:campgroundId/message/stream')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendStaffMessageStream(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SendMessageDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<{ status: string; message: string }> {
    this.logger.log(`Staff chat stream from user ${req.user.id}`);

    // Fire and forget - response comes via WebSocket
    this.chatService.sendMessageStream(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    }).catch(err => {
      this.logger.error('Staff stream error:', err);
    });

    return { status: 'streaming', message: 'Response will be delivered via WebSocket' };
  }

  /**
   * Staff attachment sign endpoint
   * POST /chat/campgrounds/:campgroundId/attachments/sign
   */
  @Post('/campgrounds/:campgroundId/attachments/sign')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async signStaffAttachment(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SignChatAttachmentDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<SignChatAttachmentResponse> {
    this.validateAttachmentPayload(dto);

    const signed = await this.uploads.signUpload(dto.filename, dto.contentType);
    let downloadUrl: string | undefined;
    try {
      downloadUrl = await this.uploads.getSignedUrl(signed.key);
    } catch {
      downloadUrl = undefined;
    }

    return {
      uploadUrl: signed.uploadUrl,
      storageKey: signed.key,
      publicUrl: signed.publicUrl,
      downloadUrl,
    };
  }

  /**
   * Staff action execution endpoint
   * POST /campgrounds/:campgroundId/chat/action
   */
  @Post('/campgrounds/:campgroundId/action')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 actions per minute
  @HttpCode(HttpStatus.OK)
  async executeStaffAction(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: ExecuteActionDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<ExecuteActionResponse> {
    return this.chatService.executeAction(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Staff chat history endpoint
   * GET /campgrounds/:campgroundId/chat/history
   */
  @Get('/campgrounds/:campgroundId/history')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  async getStaffHistory(
    @Param('campgroundId') campgroundId: string,
    @Query() dto: GetHistoryDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<ConversationHistoryResponse> {
    return this.chatService.getHistory(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Staff feedback endpoint
   * POST /chat/campgrounds/:campgroundId/feedback
   */
  @Post('/campgrounds/:campgroundId/feedback')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async submitStaffFeedback(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SubmitFeedbackDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<SubmitFeedbackResponse> {
    return this.chatService.submitFeedback(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Staff regenerate endpoint
   * POST /chat/campgrounds/:campgroundId/regenerate
   */
  @Post('/campgrounds/:campgroundId/regenerate')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async regenerateStaffMessage(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: RegenerateMessageDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<ChatMessageResponse> {
    return this.chatService.regenerateMessage(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Staff conversation list endpoint
   * GET /campgrounds/:campgroundId/chat/conversations
   */
  @Get('/campgrounds/:campgroundId/conversations')
  @UseGuards(JwtAuthGuard, ScopeGuard)
  async getStaffConversations(
    @Param('campgroundId') campgroundId: string,
    @Query() dto: GetConversationsDto,
    @Req() req: StaffAuthenticatedRequest,
  ): Promise<ConversationListResponse> {
    return this.chatService.getConversations(dto, {
      campgroundId,
      participantType: ChatParticipantType.staff,
      participantId: req.user.id,
      role: this.getStaffRole(req, campgroundId),
    });
  }

  /**
   * Guest chat endpoint (for portal)
   * POST /portal/:campgroundId/chat/message
   * Requires guest authentication - guest must be logged in via magic link
   */
  @Post('/portal/:campgroundId/message')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 messages per minute for guests
  @HttpCode(HttpStatus.OK)
  async sendGuestMessage(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SendMessageDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<ChatMessageResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    this.logger.log(`Guest chat message from guest ${guest.id}`);

    return this.chatService.sendMessage(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }

  /**
   * Guest chat streaming endpoint (uses WebSocket for response)
   * POST /portal/:campgroundId/chat/message/stream
   */
  @Post('/portal/:campgroundId/message/stream')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendGuestMessageStream(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SendMessageDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<{ status: string; message: string }> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    this.logger.log(`Guest chat stream from ${guest.id}`);

    // Fire and forget - response comes via WebSocket
    this.chatService.sendMessageStream(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    }).catch(err => {
      this.logger.error('Guest stream error:', err);
    });

    return { status: 'streaming', message: 'Response will be delivered via WebSocket' };
  }

  /**
   * Guest attachment sign endpoint
   * POST /chat/portal/:campgroundId/attachments/sign
   */
  @Post('/portal/:campgroundId/attachments/sign')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async signGuestAttachment(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SignChatAttachmentDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<SignChatAttachmentResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);
    this.validateAttachmentPayload(dto);

    const signed = await this.uploads.signUpload(dto.filename, dto.contentType);
    let downloadUrl: string | undefined;
    try {
      downloadUrl = await this.uploads.getSignedUrl(signed.key);
    } catch {
      downloadUrl = undefined;
    }

    return {
      uploadUrl: signed.uploadUrl,
      storageKey: signed.key,
      publicUrl: signed.publicUrl,
      downloadUrl,
    };
  }

  /**
   * Guest action execution endpoint
   * POST /portal/:campgroundId/chat/action
   */
  @Post('/portal/:campgroundId/action')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 actions per minute
  @HttpCode(HttpStatus.OK)
  async executeGuestAction(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: ExecuteActionDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<ExecuteActionResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    return this.chatService.executeAction(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }

  /**
   * Guest chat history endpoint
   * GET /portal/:campgroundId/chat/history
   */
  @Get('/portal/:campgroundId/history')
  @UseGuards(AuthGuard('guest-jwt'))
  async getGuestHistory(
    @Param('campgroundId') campgroundId: string,
    @Query() dto: GetHistoryDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<ConversationHistoryResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    return this.chatService.getHistory(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }

  /**
   * Guest feedback endpoint
   * POST /chat/portal/:campgroundId/feedback
   */
  @Post('/portal/:campgroundId/feedback')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async submitGuestFeedback(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: SubmitFeedbackDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<SubmitFeedbackResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    return this.chatService.submitFeedback(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }

  /**
   * Guest regenerate endpoint
   * POST /chat/portal/:campgroundId/regenerate
   */
  @Post('/portal/:campgroundId/regenerate')
  @UseGuards(AuthGuard('guest-jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async regenerateGuestMessage(
    @Param('campgroundId') campgroundId: string,
    @Body() dto: RegenerateMessageDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<ChatMessageResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    return this.chatService.regenerateMessage(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }

  /**
   * Guest conversation list endpoint
   * GET /portal/:campgroundId/chat/conversations
   */
  @Get('/portal/:campgroundId/conversations')
  @UseGuards(AuthGuard('guest-jwt'))
  async getGuestConversations(
    @Param('campgroundId') campgroundId: string,
    @Query() dto: GetConversationsDto,
    @Req() req: GuestAuthenticatedRequest,
  ): Promise<ConversationListResponse> {
    const guest = req.user;

    await this.chatService.assertGuestAccess(guest.id, campgroundId);

    return this.chatService.getConversations(dto, {
      campgroundId,
      participantType: ChatParticipantType.guest,
      participantId: guest.id,
    });
  }
}
