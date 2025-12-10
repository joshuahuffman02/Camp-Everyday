import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { ApiAuthService } from "./api-auth.service";
import { ApiScope } from "./types";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  campgroundId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsOptional()
  scopes?: ApiScope[];
}

class ToggleClientDto {
  @IsBoolean()
  isActive!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller("developer/clients")
export class DeveloperAdminController {
  constructor(private readonly apiAuth: ApiAuthService) { }

  @Get()
  list(@Query("campgroundId") campgroundId: string) {
    return this.apiAuth.listClients(campgroundId);
  }

  @Post()
  async create(@Body() body: CreateClientDto) {
    return this.apiAuth.createClient(body);
  }

  @Post(":id/rotate")
  rotate(@Param("id") id: string) {
    return this.apiAuth.rotateSecret(id);
  }

  @Patch(":id/toggle")
  toggle(@Param("id") id: string, @Body() body: ToggleClientDto) {
    return this.apiAuth.setClientActive(id, body.isActive);
  }

  @Post("tokens/:id/revoke")
  revokeToken(@Param("id") id: string) {
    return this.apiAuth.revokeToken(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.apiAuth.deleteClient(id);
  }
}

