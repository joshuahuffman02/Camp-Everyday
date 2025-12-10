import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PushSubscriptionsService } from "./push-subscriptions.service";

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: string | number | null;
  keys?: Record<string, string>;
};

type SubscribeRequest = {
  campgroundId?: string;
  subscription?: PushSubscriptionPayload;
};

@UseGuards(JwtAuthGuard)
@Controller("push")
export class PushSubscriptionsController {
  constructor(private readonly pushSubscriptions: PushSubscriptionsService) {}

  @Post("subscribe")
  async subscribe(@Body() body: SubscribeRequest, @Req() req: any) {
    const subscription = (body as any).subscription ?? (body as any);
    const campgroundId = (body as any).campgroundId;

    return this.pushSubscriptions.upsertSubscription({
      subscription,
      campgroundId,
      userId: req.user?.userId,
      userAgent: req.headers["user-agent"] ?? null,
    });
  }
}

