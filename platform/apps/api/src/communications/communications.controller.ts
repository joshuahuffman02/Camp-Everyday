import { Body, Controller, Get, Post, BadRequestException, UseGuards, Query, InternalServerErrorException, Patch, Param } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommunicationDto } from "./dto/create-communication.dto";
import { ListCommunicationsDto } from "./dto/list-communications.dto";
import { SendCommunicationDto } from "./dto/send-communication.dto";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { ScopeGuard } from "../permissions/scope.guard";
import { RequireScope } from "../permissions/scope.decorator";
import { UserRole } from "@prisma/client";
import { EmailService } from "../email/email.service";
import { SmsService } from "../sms/sms.service";
import { Prisma } from "@prisma/client";
import { BadRequestException as NestBadRequestException } from "@nestjs/common";
import { NpsService } from "../nps/nps.service";

@Controller()
export class CommunicationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly npsService: NpsService
  ) { }

  private normalizePostmarkStatus(recordType?: string) {
    const rt = (recordType || "").toLowerCase();
    if (rt === "delivery") return "delivered";
    if (rt === "bounce") return "bounced";
    if (rt === "spamcomplaint") return "spam_complaint";
    if (rt === "deferred" || rt === "tempfail") return "deferred";
    if (rt === "open" || rt === "click") return "sent";
    return rt || "unknown";
  }

  private normalizeTwilioStatus(status?: string) {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "delivered";
    if (s === "sent") return "sent";
    if (s === "queued" || s === "accepted") return "queued";
    if (s === "failed" || s === "undelivered") return "failed";
    if (s === "receiving" || s === "received") return "received";
    return s || "unknown";
  }

  private getSenderDomain(address?: string) {
    if (!address) return null;
    const parts = address.split("@");
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  }

  private ensureVerifiedSenderDomain(address?: string) {
    const allowedList = (process.env.EMAIL_SENDER_DOMAINS || "campreserv.com")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const verifiedList = (process.env.EMAIL_VERIFIED_DOMAINS || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const domain = this.getSenderDomain(address);
    if (!domain) {
      throw new BadRequestException("fromAddress must include a domain");
    }
    if (!allowedList.includes(domain)) {
      throw new BadRequestException(
        `Unverified sender domain ${domain}. Configure SPF/DKIM/DMARC and add to EMAIL_SENDER_DOMAINS.`
      );
    }
    if (!verifiedList.includes(domain)) {
      throw new BadRequestException(
        `Sender domain ${domain} is not verified (SPF/DKIM/DMARC). Add to EMAIL_VERIFIED_DOMAINS after provider verification.`
      );
    }
    return domain;
  }

  private normalizePhone(phone?: string) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase() || "";
  }

  private async resolveGuestAndReservationByPhone(phone: string) {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return { guestId: null, reservationId: null, campgroundId: null };

    const guest = await this.prisma.guest.findFirst({
      where: { phone: { contains: normalized } },
      select: { id: true }
    });

    if (!guest) return { guestId: null, reservationId: null, campgroundId: null };

    const reservation = await this.prisma.reservation.findFirst({
      where: { guestId: guest.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, campgroundId: true }
    });

    return { guestId: guest.id, reservationId: reservation?.id ?? null, campgroundId: reservation?.campgroundId ?? null };
  }

  private ensureWebhookToken(token?: string) {
    const expected = process.env.TWILIO_WEBHOOK_TOKEN;
    if (!expected) return true; // allow if not set
    return token === expected;
  }

  private ensurePostmarkToken(token?: string) {
    const expected = process.env.POSTMARK_WEBHOOK_TOKEN;
    if (!expected) return true;
    return token === expected;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @RequireScope({ resource: "communications", action: "write" })
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.marketing, UserRole.readonly)
  @Post("communications")
  async create(@Body() body: CreateCommunicationDto) {
    if (!body.guestId && !body.reservationId) {
      throw new BadRequestException("guestId or reservationId is required");
    }
    const communication = await (this.prisma as any).communication.create({
      data: {
        campgroundId: body.campgroundId,
        organizationId: body.organizationId ?? null,
        guestId: body.guestId ?? null,
        reservationId: body.reservationId ?? null,
        type: body.type,
        direction: body.direction,
        subject: body.subject ?? null,
        body: body.body ?? null,
        preview: body.body ? body.body.slice(0, 280) : null,
        status: body.direction === "inbound" ? "received" : "sent",
        provider: body.provider ?? null,
        providerMessageId: body.providerMessageId ?? null,
        toAddress: body.toAddress ?? null,
        fromAddress: body.fromAddress ?? null
      }
    });
    return communication;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @RequireScope({ resource: "communications", action: "read" })
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.marketing, UserRole.readonly)
  @Get("communications")
  async list(@Query() query: ListCommunicationsDto) {
    if (!query.campgroundId) throw new BadRequestException("campgroundId is required");
    const limit = Math.min(query.limit || 20, 100);

    const where: any = { campgroundId: query.campgroundId };
    if (query.guestId) where.guestId = query.guestId;
    if (query.reservationId) where.reservationId = query.reservationId;
    if (query.type) where.type = query.type;
    if (query.direction) where.direction = query.direction;

    const communications = await (this.prisma as any).communication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {})
    });

    const hasMore = communications.length > limit;
    const items = hasMore ? communications.slice(0, limit) : communications;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Send outbound communication (email now; sms stub)
   */
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @RequireScope({ resource: "communications", action: "write" })
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.marketing)
  @Post("communications/send")
  async send(@Body() body: SendCommunicationDto) {
    if (!body.campgroundId) throw new BadRequestException("campgroundId is required");
    const prisma = this.prisma as any;
    if (body.type === "email") {
      if (!body.toAddress) throw new BadRequestException("toAddress is required for email");
      // Enforce verified sender domain before attempting send
      const senderAddress = body.fromAddress || process.env.SMTP_FROM || "no-reply@campreserv.com";
      const senderDomain = this.ensureVerifiedSenderDomain(senderAddress);
      const comm = await prisma.communication.create({
        data: {
          campgroundId: body.campgroundId,
          organizationId: body.organizationId ?? null,
          guestId: body.guestId ?? null,
          reservationId: body.reservationId ?? null,
          type: "email",
          direction: "outbound",
          subject: body.subject ?? null,
          body: body.body ?? null,
          preview: body.body ? body.body.slice(0, 280) : body.subject ?? null,
          status: "queued",
          provider: "postmark",
          providerMessageId: null,
          toAddress: body.toAddress,
          fromAddress: senderAddress,
          metadata: {
            senderDomain,
            senderDomainAllowed: true
          }
        }
      });

      try {
        const result = await this.emailService.sendEmail({
          to: body.toAddress,
          subject: body.subject || "Message from campground",
          html: body.body || ""
        });
        const updated = await prisma.communication.update({
          where: { id: comm.id },
          data: {
            status: "sent",
            provider: result.provider || "postmark",
            providerMessageId: result.providerMessageId ?? null,
            sentAt: new Date(),
            metadata: { ...(comm as any).metadata, provider: result.provider, fallback: result.fallback }
          }
        });
        return updated;
      } catch (err) {
        await prisma.communication.update({
          where: { id: comm.id },
          data: { status: "failed", metadata: { ...(comm as any).metadata, error: (err as any)?.message } }
        });
        throw new InternalServerErrorException("Failed to send email");
      }
    }

    // For now, other types just create a note record
    const comm = await prisma.communication.create({
      data: {
        campgroundId: body.campgroundId,
        organizationId: body.organizationId ?? null,
        guestId: body.guestId ?? null,
        reservationId: body.reservationId ?? null,
        type: body.type,
        direction: "outbound",
        subject: body.subject ?? null,
        body: body.body ?? null,
        preview: body.body ? body.body.slice(0, 280) : body.subject ?? null,
        status: "sent",
        provider: body.provider ?? null,
        providerMessageId: body.providerMessageId ?? null,
        toAddress: body.toAddress ?? null,
        fromAddress: body.fromAddress ?? null
      }
    });
    return comm;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @RequireScope({ resource: "communications", action: "read" })
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.marketing, UserRole.readonly)
  @Get("communications/sender-status")
  async senderStatus() {
    const allowedList = (process.env.EMAIL_SENDER_DOMAINS || "campreserv.com")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const verifiedList = (process.env.EMAIL_VERIFIED_DOMAINS || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    const defaultFrom = process.env.SMTP_FROM || "no-reply@campreserv.com";
    const domains = allowedList.map((d) => ({
      domain: d,
      allowed: true,
      verified: verifiedList.includes(d),
      issues: verifiedList.includes(d) ? [] : ["Domain not in EMAIL_VERIFIED_DOMAINS (SPF/DKIM/DMARC not confirmed)"]
    }));
    const smsConfigured = Boolean(process.env.TWILIO_WEBHOOK_TOKEN);
    return {
      allowedDomains: allowedList,
      verifiedDomains: verifiedList,
      domains,
      defaultFrom,
      configured: allowedList.length > 0,
      smsWebhookConfigured: smsConfigured,
      enforcement: "fail_closed",
      note: "Domains must be listed in EMAIL_SENDER_DOMAINS and EMAIL_VERIFIED_DOMAINS after provider verification (SPF/DKIM/DMARC)."
    };
  }

  /**
   * Twilio inbound SMS webhook
   */
  @Post("communications/webhook/twilio")
  async twilioInbound(@Body() body: any, @Query("token") token?: string) {
    if (!this.ensureWebhookToken(token)) {
      throw new BadRequestException("Invalid webhook token");
    }
    const from = body.From as string | undefined;
    const to = body.To as string | undefined;
    const messageSid = body.MessageSid as string | undefined;
    const text = body.Body as string | undefined;
    if (!from || !to || !messageSid) {
      throw new BadRequestException("Missing required Twilio fields");
    }

    const { guestId, reservationId, campgroundId } = await this.resolveGuestAndReservationByPhone(from);

    const communication = await (this.prisma as any).communication.create({
      data: {
        campgroundId: body.campgroundId || campgroundId || "",
        organizationId: null,
        guestId,
        reservationId,
        type: "sms",
        direction: "inbound",
        subject: null,
        body: text ?? null,
        preview: text ? text.slice(0, 280) : null,
        status: "received",
        provider: "twilio",
        providerMessageId: messageSid,
        toAddress: to,
        fromAddress: from,
        receivedAt: new Date()
      }
    });

    return { ok: true, id: communication.id };
  }

  /**
   * Twilio status webhook for outbound SMS
   */
  @Post("communications/webhook/twilio/status")
  async twilioStatus(@Body() body: any, @Query("token") token?: string) {
    if (!this.ensureWebhookToken(token)) {
      throw new BadRequestException("Invalid webhook token");
    }
    const messageSid = body.MessageSid as string | undefined;
    if (!messageSid) {
      throw new BadRequestException("Missing MessageSid");
    }
    const status = this.normalizeTwilioStatus((body.MessageStatus || body.SmsStatus || "").toString());

    await (this.prisma as any).communication.updateMany({
      where: { providerMessageId: messageSid },
      data: { status, metadata: body }
    });

    return { ok: true };
  }

  /**
   * Postmark inbound email webhook
   */
  @Post("communications/webhook/postmark/inbound")
  async postmarkInbound(@Body() body: any, @Query("token") token?: string) {
    if (!this.ensurePostmarkToken(token)) {
      throw new BadRequestException("Invalid webhook token");
    }
    const from = body.FromFull?.Email as string | undefined;
    const to = body.ToFull?.[0]?.Email as string | undefined;
    const subject = body.Subject as string | undefined;
    const textBody = body.TextBody as string | undefined;
    const messageId = body.MessageID as string | undefined;

    if (!from || !to || !messageId) {
      throw new BadRequestException("Missing required Postmark fields");
    }

    // Best-effort match by sender email to guest
    const normalizedFrom = this.normalizeEmail(from);
    const guest = normalizedFrom
      ? await this.prisma.guest.findFirst({
        where: { email: { equals: normalizedFrom, mode: "insensitive" } },
        select: { id: true }
      })
      : null;

    const reservation = guest
      ? await this.prisma.reservation.findFirst({
        where: { guestId: guest.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, campgroundId: true }
      })
      : null;

    const communication = await (this.prisma as any).communication.create({
      data: {
        campgroundId: body.campgroundId || reservation?.campgroundId || "",
        organizationId: null,
        guestId: guest?.id ?? null,
        reservationId: reservation?.id ?? null,
        type: "email",
        direction: "inbound",
        subject: subject ?? null,
        body: textBody ?? null,
        preview: textBody ? textBody.slice(0, 280) : subject ?? null,
        status: "received",
        provider: "postmark",
        providerMessageId: messageId,
        toAddress: to,
        fromAddress: from,
        receivedAt: new Date()
      }
    });

    return { ok: true, id: communication.id };
  }

  /**
   * Postmark delivery/bounce webhook
   */
  @Post("communications/webhook/postmark/status")
  async postmarkStatus(@Body() body: any, @Query("token") token?: string) {
    if (!this.ensurePostmarkToken(token)) {
      throw new BadRequestException("Invalid webhook token");
    }
    const messageId = body.MessageID as string | undefined;
    if (!messageId) {
      throw new BadRequestException("Missing MessageID");
    }
    const status = this.normalizePostmarkStatus(body.RecordType);
    const bounceType = (body.BounceType || "").toString().toLowerCase();
    const isHardFail = status === "bounced" || status === "spam_complaint" || bounceType === "hardbounce";
    const finalStatus = isHardFail ? "failed" : status;
    const metadata = {
      ...body,
      normalizedStatus: status,
      bounceType: body.BounceType,
      bounceSubType: body.BounceSubType,
      description: body.Description
    };

    await (this.prisma as any).communication.updateMany({
      where: { providerMessageId: messageId },
      data: { status: finalStatus, metadata }
    });

    return { ok: true };
  }

  // ===========================================================================
  // TEMPLATES
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Get("communications/templates")
  async listTemplates(@Query("campgroundId") campgroundId?: string, @Query("status") status?: string) {
    if (!campgroundId) throw new BadRequestException("campgroundId is required");
    const where: any = { campgroundId };
    if (status) where.status = status;
    const templates = await (this.prisma as any).communicationTemplate.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }]
    });
    return templates;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Post("communications/templates")
  async createTemplate(@Body() body: { campgroundId: string; name: string; subject?: string; bodyHtml?: string }) {
    if (!body.campgroundId || !body.name) {
      throw new BadRequestException("campgroundId and name are required");
    }
    const template = await (this.prisma as any).communicationTemplate.create({
      data: {
        campgroundId: body.campgroundId,
        name: body.name,
        subject: body.subject ?? null,
        bodyHtml: body.bodyHtml ?? null,
        status: "draft",
        version: 1,
        auditLog: [{ action: "created", at: new Date().toISOString() }]
      }
    });
    return template;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Patch("communications/templates/:id")
  async updateTemplate(
    @Param("id") id: string,
    @Body() body: { name?: string; subject?: string; bodyHtml?: string; status?: string; campgroundId?: string },
    @Query("campgroundId") campgroundId?: string
  ) {
    const existing = await (this.prisma as any).communicationTemplate.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException("Template not found");
    if (campgroundId && existing.campgroundId !== campgroundId) {
      throw new BadRequestException("Unauthorized campground scope");
    }

    const auditEntry = {
      action: "updated",
      at: new Date().toISOString(),
      changes: ["name", "subject", "bodyHtml", "status"].reduce((acc: any, key) => {
        if ((body as any)[key] !== undefined && (body as any)[key] !== (existing as any)[key]) {
          acc[key] = { from: (existing as any)[key], to: (body as any)[key] };
        }
        return acc;
      }, {})
    };

    const updated = await (this.prisma as any).communicationTemplate.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        subject: body.subject ?? existing.subject,
        bodyHtml: body.bodyHtml ?? existing.bodyHtml,
        status: body.status ?? existing.status,
        auditLog: [...(existing.auditLog as any[]) ?? [], auditEntry]
      }
    });
    return updated;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Get("communications/playbooks/jobs")
  async listJobs(@Query("campgroundId") campgroundId?: string, @Query("status") status?: string) {
    if (!campgroundId) throw new BadRequestException("campgroundId is required");
    const where: any = { campgroundId };
    if (status) where.status = status;
    return (this.prisma as any).communicationPlaybookJob.findMany({
      where,
      orderBy: [{ scheduledAt: "asc" }]
    });
  }

  private isQuietHours(campground: any, date: Date) {
    if (!campground?.quietHoursStart || !campground?.quietHoursEnd) return false;
    const [sh, sm] = campground.quietHoursStart.split(":").map((n: string) => Number(n));
    const [eh, em] = campground.quietHoursEnd.split(":").map((n: string) => Number(n));
    const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    const start = sh * 60 + (sm || 0);
    const end = eh * 60 + (em || 0);
    if (start === end) return false;
    if (start < end) return minutes >= start && minutes < end;
    return minutes >= start || minutes < end;
  }

  private async processJob(job: any) {
    const playbook = await (this.prisma as any).communicationPlaybook.findUnique({
      where: { id: job.playbookId },
      include: { campground: true, template: true }
    });
    if (!playbook || !playbook.enabled) {
      await (this.prisma as any).communicationPlaybookJob.update({ where: { id: job.id }, data: { status: "skipped", lastError: "Playbook disabled" } });
      return;
    }
    if (!playbook.template || playbook.template.status !== "approved") {
      await (this.prisma as any).communicationPlaybookJob.update({ where: { id: job.id }, data: { status: "skipped", lastError: "Template not approved" } });
      return;
    }
    const now = new Date();
    if (this.isQuietHours(playbook.campground, now)) {
      // reschedule to quietHoursEnd
      const [eh, em] = (playbook.campground.quietHoursEnd || "08:00").split(":").map((n: string) => Number(n));
      const next = new Date(now);
      next.setUTCHours(eh || 8, em || 0, 0, 0);
      await (this.prisma as any).communicationPlaybookJob.update({
        where: { id: job.id },
        data: { scheduledAt: next, attempts: job.attempts + 1 }
      });
      return;
    }

    const reservation = job.reservationId
      ? await (this.prisma as any).reservation.findUnique({ where: { id: job.reservationId }, include: { guest: true } })
      : null;
    const guest = reservation?.guest || (job.guestId ? await (this.prisma as any).guest.findUnique({ where: { id: job.guestId } }) : null);

    const toEmail = guest?.email || reservation?.guest?.email;
    const toPhone = guest?.phone || reservation?.guest?.phone;

    try {
      await (this.prisma as any).communicationPlaybookJob.update({ where: { id: job.id }, data: { status: "processing", attempts: job.attempts + 1 } });

      if (playbook.type === "nps") {
        if (!toEmail) throw new Error("Missing recipient email");
        const metadata = job.metadata || {};
        const surveyId = metadata.surveyId;
        if (!surveyId) throw new Error("Missing surveyId for NPS job");
        const templateId = metadata.templateId || playbook.templateId || null;
        await this.npsService.createInvite({
          surveyId,
          campgroundId: job.campgroundId,
          guestId: job.guestId ?? undefined,
          reservationId: job.reservationId ?? undefined,
          channel: "email",
          email: toEmail,
          templateId: templateId ?? undefined,
          expireDays: 30
        });
      } else if (playbook.channel === "email") {
        if (!toEmail) throw new Error("Missing recipient email");
        await this.emailService.sendEmail({
          to: toEmail,
          subject: playbook.template.subject || "Message from campground",
          html: playbook.template.bodyHtml || ""
        });
      } else if (playbook.channel === "sms") {
        if (!toPhone) throw new Error("Missing recipient phone");
        await this.smsService.sendSms({ to: toPhone, body: playbook.template.bodyHtml || playbook.template.subject || "Message" });
      }

      await (this.prisma as any).communicationPlaybookJob.update({
        where: { id: job.id },
        data: { status: "sent", lastError: null }
      });
    } catch (err: any) {
      const attempts = job.attempts + 1;
      const maxAttempts = 3;
      const nextTime = new Date(now);
      nextTime.setMinutes(nextTime.getMinutes() + Math.min(30, attempts * 5));
      await (this.prisma as any).communicationPlaybookJob.update({
        where: { id: job.id },
        data: {
          status: attempts >= maxAttempts ? "failed" : "pending",
          scheduledAt: attempts >= maxAttempts ? job.scheduledAt : nextTime,
          attempts,
          lastError: err?.message || "Send failed"
        }
      });
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Post("communications/playbooks/run")
  async runPlaybookJobs(@Query("campgroundId") campgroundId?: string) {
    const now = new Date();
    const jobs = await (this.prisma as any).communicationPlaybookJob.findMany({
      where: {
        status: "pending",
        scheduledAt: { lte: now },
        ...(campgroundId ? { campgroundId } : {})
      },
      orderBy: { scheduledAt: "asc" },
      take: 25
    });
    for (const job of jobs) {
      await this.processJob(job);
    }
    return { processed: jobs.length };
  }

  @Cron("*/5 * * * *") // every 5 minutes
  async cronRunPlaybookJobs() {
    await this.runPlaybookJobs();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Post("communications/playbooks/jobs/:id/retry")
  async retryPlaybookJob(@Param("id") id: string, @Query("campgroundId") campgroundId?: string) {
    const job = await (this.prisma as any).communicationPlaybookJob.findUnique({ where: { id } });
    if (!job) throw new BadRequestException("Job not found");
    if (campgroundId && job.campgroundId !== campgroundId) {
      throw new BadRequestException("Job does not belong to this campground");
    }
    const updated = await (this.prisma as any).communicationPlaybookJob.update({
      where: { id },
      data: {
        status: "pending",
        scheduledAt: new Date(),
        lastError: null
      }
    });
    return updated;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Post("communications/playbooks/enqueue-unpaid")
  async enqueueUnpaidPlaybooks(@Query("campgroundId") campgroundId?: string) {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        ...(campgroundId ? { campgroundId } : {}),
        status: { not: "cancelled" },
        totalAmount: { gt: 0 }
      },
      select: { id: true, campgroundId: true, guestId: true, totalAmount: true, paidAmount: true }
    });

    const due = reservations.filter(r => Number(r.paidAmount || 0) < Number(r.totalAmount || 0));

    const playbooks = await (this.prisma as any).communicationPlaybook.findMany({
      where: {
        ...(campgroundId ? { campgroundId } : {}),
        type: "unpaid",
        enabled: true,
        templateId: { not: null }
      }
    });

    let enqueued = 0;
    for (const pb of playbooks) {
      const tpl = await (this.prisma as any).communicationTemplate.findFirst({
        where: { id: pb.templateId, status: "approved" }
      });
      if (!tpl) continue;
      for (const r of due.filter(d => d.campgroundId === pb.campgroundId)) {
        const scheduledAt = new Date();
        if (pb.offsetMinutes && Number.isFinite(pb.offsetMinutes)) {
          scheduledAt.setMinutes(scheduledAt.getMinutes() + pb.offsetMinutes);
        }
        await (this.prisma as any).communicationPlaybookJob.create({
          data: {
            playbookId: pb.id,
            campgroundId: r.campgroundId,
            reservationId: r.id,
            guestId: r.guestId,
            status: "pending",
            scheduledAt
          }
        });
        enqueued++;
      }
    }

    return { enqueued };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager)
  @Post("communications/templates/:id/approve")
  async approveTemplate(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Query("campgroundId") campgroundId?: string,
    @Query("actorId") actorId?: string
  ) {
    const existing = await (this.prisma as any).communicationTemplate.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException("Template not found");
    if (campgroundId && existing.campgroundId !== campgroundId) {
      throw new BadRequestException("Unauthorized campground scope");
    }
    const auditEntry = {
      action: "approved",
      at: new Date().toISOString(),
      actorId: actorId ?? null,
      reason: body.reason ?? null
    };
    const updated = await (this.prisma as any).communicationTemplate.update({
      where: { id },
      data: {
        status: "approved",
        approvedById: actorId ?? null,
        approvedAt: new Date(),
        auditLog: [...(existing.auditLog as any[]) ?? [], auditEntry]
      }
    });
    return updated;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager)
  @Post("communications/templates/:id/reject")
  async rejectTemplate(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @Query("campgroundId") campgroundId?: string,
    @Query("actorId") actorId?: string
  ) {
    const existing = await (this.prisma as any).communicationTemplate.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException("Template not found");
    if (campgroundId && existing.campgroundId !== campgroundId) {
      throw new BadRequestException("Unauthorized campground scope");
    }
    const auditEntry = {
      action: "rejected",
      at: new Date().toISOString(),
      actorId: actorId ?? null,
      reason: body.reason ?? null
    };
    const updated = await (this.prisma as any).communicationTemplate.update({
      where: { id },
      data: {
        status: "rejected",
        approvedById: null,
        approvedAt: null,
        auditLog: [...(existing.auditLog as any[]) ?? [], auditEntry]
      }
    });
    return updated;
  }

  // ===========================================================================
  // PLAYBOOKS (CRUD only; wiring to events pending)
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Get("communications/playbooks")
  async listPlaybooks(@Query("campgroundId") campgroundId?: string) {
    if (!campgroundId) throw new BadRequestException("campgroundId is required");
    return (this.prisma as any).communicationPlaybook.findMany({
      where: { campgroundId },
      orderBy: { updatedAt: "desc" }
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Post("communications/playbooks")
  async createPlaybook(
    @Body() body: {
      campgroundId: string;
      type: string;
      enabled?: boolean;
      templateId?: string;
      channel?: string;
      offsetMinutes?: number;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      throttlePerMinute?: number;
      routingAssigneeId?: string;
    }
  ) {
    if (!body.campgroundId || !body.type) throw new BadRequestException("campgroundId and type are required");
    return (this.prisma as any).communicationPlaybook.create({
      data: {
        campgroundId: body.campgroundId,
        type: body.type,
        enabled: body.enabled ?? false,
        templateId: body.templateId ?? null,
        channel: body.channel ?? null,
        offsetMinutes: body.offsetMinutes ?? null,
        quietHoursStart: body.quietHoursStart ?? null,
        quietHoursEnd: body.quietHoursEnd ?? null,
        throttlePerMinute: body.throttlePerMinute ?? null,
        routingAssigneeId: body.routingAssigneeId ?? null
      }
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.owner, UserRole.manager, UserRole.marketing)
  @Patch("communications/playbooks/:id")
  async updatePlaybook(
    @Param("id") id: string,
    @Body() body: {
      campgroundId?: string;
      enabled?: boolean;
      templateId?: string | null;
      channel?: string | null;
      offsetMinutes?: number | null;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
      throttlePerMinute?: number | null;
      routingAssigneeId?: string | null;
    },
    @Query("campgroundId") campgroundId?: string
  ) {
    const existing = await (this.prisma as any).communicationPlaybook.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException("Playbook not found");
    if (campgroundId && existing.campgroundId !== campgroundId) {
      throw new BadRequestException("Unauthorized campground scope");
    }
    return (this.prisma as any).communicationPlaybook.update({
      where: { id },
      data: {
        enabled: body.enabled ?? existing.enabled,
        templateId: body.templateId !== undefined ? body.templateId : existing.templateId,
        channel: body.channel !== undefined ? body.channel : existing.channel,
        offsetMinutes: body.offsetMinutes !== undefined ? body.offsetMinutes : existing.offsetMinutes,
        quietHoursStart: body.quietHoursStart !== undefined ? body.quietHoursStart : existing.quietHoursStart,
        quietHoursEnd: body.quietHoursEnd !== undefined ? body.quietHoursEnd : existing.quietHoursEnd,
        throttlePerMinute: body.throttlePerMinute !== undefined ? body.throttlePerMinute : existing.throttlePerMinute,
        routingAssigneeId: body.routingAssigneeId !== undefined ? body.routingAssigneeId : existing.routingAssigneeId
      }
    });
  }
}

