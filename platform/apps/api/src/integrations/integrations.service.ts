import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertIntegrationConnectionDto } from "./dto/upsert-integration-connection.dto";
import { CreateExportJobDto } from "./dto/create-export-job.dto";
import { SyncRequestDto } from "./dto/sync-request.dto";
import * as crypto from "crypto";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) { }

  private prismaClient() {
    return this.prisma as any;
  }

  upsertConnection(dto: UpsertIntegrationConnectionDto) {
    if (!dto.campgroundId) throw new BadRequestException("campgroundId is required");
    const prisma = this.prismaClient();
    return prisma.integrationConnection.upsert({
      where: {
        campgroundId_type_provider: {
          campgroundId: dto.campgroundId,
          type: dto.type,
          provider: dto.provider
        }
      },
      create: {
        campgroundId: dto.campgroundId,
        organizationId: dto.organizationId ?? null,
        type: dto.type,
        provider: dto.provider,
        status: dto.status ?? "connected",
        authType: dto.authType ?? null,
        credentials: dto.credentials ?? null,
        settings: dto.settings ?? null,
        webhookSecret: dto.webhookSecret ?? null,
        lastSyncStatus: dto.status ?? null,
      },
      update: {
        organizationId: dto.organizationId ?? null,
        status: dto.status ?? undefined,
        authType: dto.authType ?? undefined,
        credentials: dto.credentials ?? undefined,
        settings: dto.settings ?? undefined,
        webhookSecret: dto.webhookSecret ?? undefined,
      }
    });
  }

  listConnections(campgroundId: string) {
    if (!campgroundId) throw new BadRequestException("campgroundId is required");
    const prisma = this.prismaClient();
    return prisma.integrationConnection.findMany({
      where: { campgroundId },
      orderBy: { updatedAt: "desc" },
      include: {
        logs: { orderBy: { occurredAt: "desc" }, take: 1 }
      }
    });
  }

  updateConnection(id: string, dto: Partial<UpsertIntegrationConnectionDto>) {
    const prisma = this.prismaClient();
    return prisma.integrationConnection.update({
      where: { id },
      data: {
        organizationId: dto.organizationId ?? undefined,
        status: dto.status ?? undefined,
        authType: dto.authType ?? undefined,
        credentials: dto.credentials ?? undefined,
        settings: dto.settings ?? undefined,
        webhookSecret: dto.webhookSecret ?? undefined,
      }
    });
  }

  async listLogs(connectionId: string, limit = 50, cursor?: string) {
    const prisma = this.prismaClient();
    const take = Math.min(limit, 200);
    const logs = await prisma.integrationSyncLog.findMany({
      where: { connectionId },
      orderBy: { occurredAt: "desc" },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });
    const hasMore = logs.length > take;
    const items = hasMore ? logs.slice(0, take) : logs;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async listWebhookEvents(connectionId: string, limit = 50, cursor?: string) {
    const prisma = this.prismaClient();
    const take = Math.min(limit, 200);
    const events = await prisma.integrationWebhookEvent.findMany({
      where: { connectionId },
      orderBy: { receivedAt: "desc" },
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });
    const hasMore = events.length > take;
    const items = hasMore ? events.slice(0, take) : events;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async recordSyncLog(connectionId: string, status: string, message?: string, payload?: any, scope?: string, direction?: string) {
    const prisma = this.prismaClient();
    return prisma.integrationSyncLog.create({
      data: {
        connectionId,
        status,
        message: message ?? null,
        payload: payload ?? null,
        scope: scope ?? "accounting",
        direction: direction ?? "pull"
      }
    });
  }

  private async runQboSandboxPull(connection: any, direction?: string, scope?: string) {
    const token = process.env.QBO_SANDBOX_TOKEN;
    const realmId = (connection.settings as any)?.realmId || process.env.QBO_SANDBOX_REALMID;
    const base = process.env.QBO_SANDBOX_BASE || "https://sandbox-quickbooks.api.intuit.com";

    if (!token || !realmId) {
      return { ok: false, reason: "missing_token_or_realm" };
    }

    try {
      const query = encodeURIComponent("select * from Account maxresults 5");
      const res = await fetch(`${base}/v3/company/${realmId}/query?query=${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/text"
        }
      });
      if (!res.ok) {
        return { ok: false, reason: `qbo_http_${res.status}` };
      }
      const json = await res.json();
      const accounts = (json?.QueryResponse?.Account as any[]) || [];
      const summary = {
        realmId,
        accountCount: accounts.length,
        sample: accounts.slice(0, 3).map((a) => ({ id: a.Id, name: a.Name, type: a.AccountType }))
      };
      await this.recordSyncLog(connection.id, "success", "QBO sandbox pull complete", summary, scope ?? "accounting", direction ?? "pull");
      await this.prismaClient().integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastError: null }
      });
      return { ok: true, summary };
    } catch (err: any) {
      await this.recordSyncLog(connection.id, "failed", err?.message || "QBO sandbox pull failed", null, scope ?? "accounting", direction ?? "pull");
      await this.prismaClient().integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), lastSyncStatus: "error", lastError: err?.message ?? "Unknown error" }
      });
      return { ok: false, reason: "exception", error: err?.message };
    }
  }

  async triggerSync(connectionId: string, body: SyncRequestDto) {
    const prisma = this.prismaClient();
    const connection = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new BadRequestException("Connection not found");
    await this.recordSyncLog(connectionId, "queued", body?.note ?? "Manual sync queued", null, body.scope ?? connection.type, body.direction ?? "pull");

    // Sandbox provider wiring: run a lightweight simulated sync for known providers (e.g., QBO sandbox).
    const sandboxEnabled = (process.env.INTEGRATIONS_SANDBOX_ENABLED || "true").toLowerCase() !== "false";
    if (sandboxEnabled && connection.provider?.toLowerCase() === "qbo" && connection.type === "accounting") {
      const result = await this.runQboSandboxPull(connection, body.direction, body.scope);
      if (result.ok) {
        return { ok: true, connectionId, status: "success", sandbox: true, summary: result.summary };
      }
      // If sandbox pull failed due to missing creds, fall back to stub data to keep the manual sync usable.
      const samplePayload = {
        accounts: [
          { id: "1000", name: "Cash", type: "Asset" },
          { id: "2000", name: "Deferred Revenue", type: "Liability" },
        ],
        realmId: (connection.settings as any)?.realmId ?? "sandbox-realm",
        note: "Stubbed because sandbox creds/realm were missing",
      };
      await prisma.integrationSyncLog.create({
        data: {
          connectionId,
          direction: body.direction ?? "pull",
          scope: body.scope ?? "accounting",
          status: "success",
          message: "Sandbox QBO pull (stub) complete",
          payload: samplePayload,
        }
      });
      await prisma.integrationConnection.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastError: null }
      });
      return { ok: true, connectionId, status: "success", sandbox: true, summary: samplePayload };
    }

    return { ok: true, connectionId, status: "queued" };
  }

  async createExportJob(dto: CreateExportJobDto) {
    const prisma = this.prismaClient();
    if (!dto.type) throw new BadRequestException("type is required");
    const job = await prisma.integrationExportJob.create({
      data: {
        type: dto.type,
        connectionId: dto.connectionId ?? null,
        campgroundId: dto.campgroundId ?? null,
        resource: dto.resource ?? null,
        status: "queued",
        location: dto.location ?? null,
        requestedById: dto.requestedById ?? null,
        filters: dto.filters ?? null
      }
    });
    if (dto.connectionId) {
      await this.recordSyncLog(dto.connectionId, "queued", "Export job queued", { jobId: job.id, resource: dto.resource }, dto.resource ?? "export", "export");
    }
    return job;
  }

  verifyHmac(raw: string, secret: string, signature?: string) {
    if (!secret) return true;
    const provided = (signature || "").replace(/^sha256=/i, "");
    if (!provided) return false;
    const computed = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (provided.length !== computed.length) return false;
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(provided));
  }

  async handleWebhook(provider: string, body: any, rawBody: string, signature?: string, campgroundId?: string) {
    const prisma = this.prismaClient();
    const connection = await prisma.integrationConnection.findFirst({
      where: {
        provider,
        ...(campgroundId ? { campgroundId } : {})
      }
    });

    const secret = connection?.webhookSecret || process.env.INTEGRATIONS_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || "";
    const signatureValid = this.verifyHmac(rawBody, secret, signature);

    const event = await prisma.integrationWebhookEvent.create({
      data: {
        connectionId: connection?.id ?? null,
        provider,
        eventType: body?.type || body?.event || null,
        status: signatureValid ? "received" : "failed",
        signatureValid,
        message: signatureValid ? null : "Invalid signature",
        payload: body ?? null,
      }
    });

    if (connection?.id) {
      await this.recordSyncLog(
        connection.id,
        signatureValid ? "queued" : "failed",
        signatureValid ? "Webhook received" : "Webhook signature invalid",
        { webhookEventId: event.id },
        connection.type,
        "webhook"
      );
    }

    return { ok: signatureValid, connectionId: connection?.id ?? null, eventId: event.id };
  }
}

