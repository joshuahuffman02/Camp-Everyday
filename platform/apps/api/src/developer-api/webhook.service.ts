import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { createHmac, randomBytes } from "crypto";

export type WebhookEvent =
  | "reservation.created"
  | "reservation.updated"
  | "reservation.deleted"
  | "payment.created"
  | "event.created"
  | "event.updated"
  | "site.created"
  | "site.updated"
  | "site.deleted"
  | "guest.created";

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) { }

  private computeSignature(secret: string, payload: string, timestamp: number) {
    const toSign = `${timestamp}.${payload}`;
    const digest = createHmac("sha256", secret).update(toSign).digest("hex");
    return `t=${timestamp},v1=${digest}`;
  }

  async createEndpoint(input: { campgroundId: string; apiClientId?: string | null; url: string; description?: string; eventTypes: string[] }) {
    const secret = `wh_${randomBytes(16).toString("hex")}`;
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        campgroundId: input.campgroundId,
        apiClientId: input.apiClientId || null,
        url: input.url,
        description: input.description,
        eventTypes: input.eventTypes,
        secret
      }
    });
    return { endpoint, secret };
  }

  listEndpoints(campgroundId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { campgroundId },
      orderBy: { createdAt: "desc" }
    });
  }

  async toggleEndpoint(id: string, isActive: boolean) {
    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: { isActive, disabledAt: isActive ? null : new Date() }
    });
  }

  async emit(eventType: WebhookEvent, campgroundId: string, payload: Record<string, any>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        campgroundId,
        isActive: true,
        OR: [{ eventTypes: { has: eventType } }, { eventTypes: { has: "*" } }]
      }
    });
    if (!endpoints.length) return;

    const body = JSON.stringify({ event: eventType, data: payload });

    for (const ep of endpoints) {
      const timestamp = Date.now();
      const signature = this.computeSignature(ep.secret, body, timestamp);
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: ep.id,
          eventType,
          status: "pending",
          payload,
          signature
        }
      });

      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-campreserv-signature": signature
          },
          body
        });
        const text = await res.text();
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: res.ok ? "delivered" : "failed",
            responseStatus: res.status,
            responseBody: text?.slice(0, 2000),
            deliveredAt: new Date()
          }
        });
      } catch (err: any) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "failed", errorMessage: err?.message || "Webhook send failed" }
        });
      }
    }
  }

  listDeliveries(campgroundId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookEndpoint: { campgroundId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { webhookEndpoint: true }
    });
  }

  async replay(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhookEndpoint: true }
    });
    if (!delivery || !delivery.webhookEndpoint) {
      throw new NotFoundException("Delivery not found");
    }

    const body = JSON.stringify({ event: delivery.eventType, data: delivery.payload });
    const timestamp = Date.now();
    const signature = this.computeSignature(delivery.webhookEndpoint.secret, body, timestamp);

    const replayLog = await this.prisma.webhookDelivery.create({
      data: {
        webhookEndpointId: delivery.webhookEndpointId,
        eventType: delivery.eventType,
        payload: delivery.payload as any,
        signature,
        status: "pending",
        attempt: (delivery.attempt || 1) + 1,
        replayOfId: delivery.id
      }
    });

    try {
      const res = await fetch(delivery.webhookEndpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-campreserv-signature": signature
        },
        body
      });
      const text = await res.text();
      await this.prisma.webhookDelivery.update({
        where: { id: replayLog.id },
        data: {
          status: res.ok ? "delivered" : "failed",
          responseStatus: res.status,
          responseBody: text?.slice(0, 2000),
          deliveredAt: new Date()
        }
      });
      return replayLog;
    } catch (err: any) {
      await this.prisma.webhookDelivery.update({
        where: { id: replayLog.id },
        data: { status: "failed", errorMessage: err?.message || "Replay failed" }
      });
      throw err;
    }
  }
}

