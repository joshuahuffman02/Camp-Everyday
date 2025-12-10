import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTokenGuard } from "./guards/api-token.guard";
import { ApiScopeGuard } from "./guards/api-scope.guard";
import { ApiScopes } from "./decorators/api-scopes.decorator";
import { PublicApiService, ApiReservationInput } from "./public-api.service";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class CreateReservationBody implements ApiReservationInput {
  @IsString() @IsNotEmpty() siteId!: string;
  @IsString() @IsNotEmpty() guestId!: string;
  @IsDateString() arrivalDate!: string;
  @IsDateString() departureDate!: string;
  @IsNumber() adults!: number;
  @IsNumber() @IsOptional() children?: number;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() notes?: string;
}

class UpdateReservationBody {
  @IsString() @IsOptional() siteId?: string;
  @IsDateString() @IsOptional() arrivalDate?: string;
  @IsDateString() @IsOptional() departureDate?: string;
  @IsNumber() @IsOptional() adults?: number;
  @IsNumber() @IsOptional() children?: number;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() notes?: string;
}

class PaymentBody {
  @IsNumber()
  amountCents!: number;

  @IsString()
  @IsOptional()
  method?: string;
}

@Controller("public/reservations")
@UseGuards(ApiTokenGuard, ApiScopeGuard)
export class PublicReservationsController {
  constructor(private readonly api: PublicApiService) { }

  @Get()
  @ApiScopes("reservations:read")
  list(@Req() req: any) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.listReservations(campgroundId);
  }

  @Get(":id")
  @ApiScopes("reservations:read")
  get(@Req() req: any, @Param("id") id: string) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.getReservation(campgroundId, id);
  }

  @Post()
  @ApiScopes("reservations:write")
  create(@Req() req: any, @Body() body: CreateReservationBody) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.createReservation(campgroundId, body);
  }

  @Patch(":id")
  @ApiScopes("reservations:write")
  update(@Req() req: any, @Param("id") id: string, @Body() body: UpdateReservationBody) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.updateReservation(campgroundId, id, body);
  }

  @Delete(":id")
  @ApiScopes("reservations:write")
  remove(@Req() req: any, @Param("id") id: string) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.deleteReservation(campgroundId, id);
  }

  @Post(":id/payments")
  @ApiScopes("reservations:write")
  pay(@Req() req: any, @Param("id") id: string, @Body() body: PaymentBody) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.recordPayment(campgroundId, id, body.amountCents, body.method);
  }
}

