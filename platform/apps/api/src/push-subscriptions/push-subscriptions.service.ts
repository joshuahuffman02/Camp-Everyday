import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type UpsertParams = {
  subscription: any;
  userId?: string;
  campgroundId?: string;
  userAgent?: string | null;
};

@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSubscription({ subscription, userId, campgroundId, userAgent }: UpsertParams) {
    const endpoint = subscription?.endpoint as string | undefined;
    if (!endpoint) {
      throw new BadRequestException("subscription.endpoint is required");
    }

    const expirationTime = subscription?.expirationTime
      ? new Date(subscription.expirationTime)
      : null;

    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        subscription,
        keys: subscription?.keys ?? null,
        expirationTime: expirationTime ?? undefined,
        userId: userId ?? null,
        campgroundId: campgroundId ?? null,
        userAgent: userAgent ?? null,
      },
      create: {
        endpoint,
        subscription,
        keys: subscription?.keys ?? null,
        expirationTime: expirationTime ?? undefined,
        userId: userId ?? null,
        campgroundId: campgroundId ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }
}

