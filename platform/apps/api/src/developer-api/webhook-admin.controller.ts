import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { WebhookService, WebhookEvent } from "./webhook.service";
import { ApiUsageService } from "./api-usage.service";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

// All supported webhook event types
const WEBHOOK_EVENT_TYPES: { event: WebhookEvent; description: string; category: string }[] = [
  // Reservations
  { event: "reservation.created", description: "New reservation created", category: "Reservations" },
  { event: "reservation.updated", description: "Reservation details updated", category: "Reservations" },
  { event: "reservation.deleted", description: "Reservation deleted", category: "Reservations" },
  { event: "reservation.checked_in", description: "Guest checked in", category: "Reservations" },
  { event: "reservation.checked_out", description: "Guest checked out", category: "Reservations" },
  { event: "reservation.cancelled", description: "Reservation cancelled", category: "Reservations" },
  // Payments
  { event: "payment.created", description: "Payment received", category: "Payments" },
  { event: "payment.refunded", description: "Payment refunded", category: "Payments" },
  { event: "payment.failed", description: "Payment failed", category: "Payments" },
  // Guests
  { event: "guest.created", description: "New guest profile created", category: "Guests" },
  { event: "guest.updated", description: "Guest profile updated", category: "Guests" },
  { event: "guest.deleted", description: "Guest profile deleted", category: "Guests" },
  // Sites
  { event: "site.created", description: "New site added", category: "Sites" },
  { event: "site.updated", description: "Site details updated", category: "Sites" },
  { event: "site.deleted", description: "Site removed", category: "Sites" },
  { event: "site.blocked", description: "Site blocked/unavailable", category: "Sites" },
  { event: "site.unblocked", description: "Site unblocked/available", category: "Sites" },
  // Events/Activities
  { event: "event.created", description: "New event/activity created", category: "Events" },
  { event: "event.updated", description: "Event details updated", category: "Events" },
  { event: "event.deleted", description: "Event cancelled/deleted", category: "Events" },
  { event: "event.registration", description: "Guest registered for event", category: "Events" },
  // Charity
  { event: "charity.donation", description: "Charity donation received", category: "Charity" },
  { event: "charity.payout", description: "Charity payout processed", category: "Charity" },
  // Store/POS
  { event: "order.created", description: "Store order placed", category: "Store" },
  { event: "order.refunded", description: "Store order refunded", category: "Store" },
  // Messaging
  { event: "message.received", description: "Message received from guest", category: "Messaging" },
  { event: "message.sent", description: "Message sent to guest", category: "Messaging" },
];

class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  eventTypes!: string[];
}

class ToggleWebhookDto {
  @IsBoolean()
  isActive!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller("developer/webhooks")
export class WebhookAdminController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly apiUsageService: ApiUsageService
  ) {}

  // Get list of all supported event types
  @Get("event-types")
  getEventTypes() {
    return {
      eventTypes: WEBHOOK_EVENT_TYPES,
      categories: [...new Set(WEBHOOK_EVENT_TYPES.map((e) => e.category))],
    };
  }

  @Get()
  list(@Query("campgroundId") campgroundId: string) {
    return this.webhookService.listEndpoints(campgroundId);
  }

  @Post()
  create(@Body() body: CreateWebhookDto) {
    return this.webhookService.createEndpoint(body);
  }

  @Patch(":id/toggle")
  toggle(@Param("id") id: string, @Body() body: ToggleWebhookDto) {
    return this.webhookService.toggleEndpoint(id, body.isActive);
  }

  @Get("deliveries")
  listDeliveries(@Query("campgroundId") campgroundId: string) {
    return this.webhookService.listDeliveries(campgroundId);
  }

  @Post("deliveries/:id/replay")
  replay(@Param("id") id: string) {
    return this.webhookService.replay(id);
  }

  // Get webhook delivery stats for a campground
  @Get("stats")
  getStats(@Query("campgroundId") campgroundId: string) {
    return this.webhookService.getStats(campgroundId);
  }

  // Process pending webhook retries (admin/cron endpoint)
  @Post("process-retries")
  processRetries() {
    return this.webhookService.processRetries();
  }

  // Get API usage stats for a campground
  @Get("api-usage")
  async getApiUsage(@Query("campgroundId") campgroundId: string, @Query("days") days?: string) {
    // This would need to aggregate across all clients for the campground
    // For now, return platform stats if admin
    return this.apiUsageService.getPlatformStats(days ? parseInt(days, 10) : 30);
  }
}
