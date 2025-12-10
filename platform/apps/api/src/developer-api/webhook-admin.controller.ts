import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { WebhookService } from "./webhook.service";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsString()
  @IsOptional()
  apiClientId?: string;

  @IsUrl()
  url!: string;

  @IsArray()
  eventTypes!: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

class ToggleWebhookDto {
  @IsBoolean()
  isActive!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller("developer/webhooks")
export class WebhookAdminController {
  constructor(private readonly webhookService: WebhookService) { }

  @Get("endpoints")
  listEndpoints(@Query("campgroundId") campgroundId: string) {
    return this.webhookService.listEndpoints(campgroundId);
  }

  @Post("endpoints")
  createEndpoint(@Body() body: CreateWebhookDto) {
    return this.webhookService.createEndpoint({
      campgroundId: body.campgroundId,
      apiClientId: body.apiClientId,
      url: body.url,
      description: body.description,
      eventTypes: body.eventTypes
    });
  }

  @Patch("endpoints/:id/toggle")
  toggle(@Param("id") id: string, @Body() body: ToggleWebhookDto) {
    return this.webhookService.toggleEndpoint(id, body.isActive as any);
  }

  @Get("deliveries")
  deliveries(@Query("campgroundId") campgroundId: string, @Query("limit") limit?: string) {
    const take = limit ? Number(limit) : 50;
    return this.webhookService.listDeliveries(campgroundId, take);
  }

  @Post("deliveries/:id/replay")
  replay(@Param("id") id: string) {
    return this.webhookService.replay(id);
  }
}

