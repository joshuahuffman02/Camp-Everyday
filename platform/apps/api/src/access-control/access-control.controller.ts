import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AccessProviderType, UserRole } from "@prisma/client";
import { AccessControlService } from "./access-control.service";
import { GrantAccessDto, RevokeAccessDto } from "./dto/access-grant.dto";
import { UpsertVehicleDto } from "./dto/vehicle.dto";
import { UpsertAccessIntegrationDto } from "./dto/access-integration.dto";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards";
import { ScopeGuard } from "../permissions/scope.guard";

@Controller()
export class AccessControlController {
  constructor(private readonly service: AccessControlService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Get("/reservations/:reservationId/access")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  getStatus(@Param("reservationId") reservationId: string) {
    return this.service.getAccessStatus(reservationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Post("/reservations/:reservationId/access/vehicle")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  upsertVehicle(@Param("reservationId") reservationId: string, @Body() dto: UpsertVehicleDto) {
    return this.service.upsertVehicle(reservationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Post("/reservations/:reservationId/access/grant")
  @Roles(UserRole.owner, UserRole.manager)
  grant(@Param("reservationId") reservationId: string, @Body() dto: GrantAccessDto) {
    return this.service.grantAccess(reservationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Post("/reservations/:reservationId/access/revoke")
  @Roles(UserRole.owner, UserRole.manager)
  revoke(@Param("reservationId") reservationId: string, @Body() dto: RevokeAccessDto) {
    return this.service.revokeAccess(reservationId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Get("/access/providers")
  @Roles(UserRole.owner, UserRole.manager)
  listProviders(@Req() req: any) {
    return this.service.listIntegrations(req.user?.campgroundId ?? req.campgroundId ?? null);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Post("/access/providers/:provider/config")
  @Roles(UserRole.owner)
  upsertProvider(
    @Param("provider") provider: AccessProviderType,
    @Body() dto: UpsertAccessIntegrationDto,
    @Req() req: any
  ) {
    return this.service.upsertIntegration(req.user?.campgroundId ?? req.campgroundId ?? null, {
      ...dto,
      provider
    });
  }

  // Webhook endpoint - no auth (called by external access control providers)
  @Post("/access/webhooks/:provider")
  async webhook(
    @Param("provider") provider: AccessProviderType,
    @Body() body: any,
    @Headers("x-signature") signature: string | undefined,
    @Req() req: any
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(body ?? {});
    const acknowledged = await this.service.verifyWebhook(
      provider,
      signature ?? (body?.signature as string | undefined),
      rawBody,
      req.headers["x-campground-id"] as string | undefined
    );
    return { acknowledged, provider };
  }
}
