import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdempotencyStatus } from "@prisma/client";
import crypto from "crypto";

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  private hashRequest(body: any) {
    const normalized = typeof body === "string" ? body : JSON.stringify(body ?? {});
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  async start(key: string, body: any, campgroundId?: string | null) {
    const requestHash = this.hashRequest(body);
    const existing = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (existing) {
      return existing;
    }
    return this.prisma.idempotencyKey.create({
      data: {
        key,
        requestHash,
        campgroundId: campgroundId ?? undefined,
        status: IdempotencyStatus.inflight
      }
    });
  }

  async complete(key: string, response: any) {
    return this.prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: IdempotencyStatus.succeeded,
        responseJson: response,
        lastSeenAt: new Date()
      }
    });
  }

  async fail(key: string) {
    return this.prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: IdempotencyStatus.failed,
        lastSeenAt: new Date()
      }
    });
  }
}

