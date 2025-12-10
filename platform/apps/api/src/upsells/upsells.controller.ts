import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UpsellsService } from "./upsells.service";
import { CreateUpsellDto } from "./dto/create-upsell.dto";
import { UpdateUpsellDto } from "./dto/update-upsell.dto";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class UpsellsController {
  constructor(private readonly upsells: UpsellsService) {}

  @Roles(UserRole.owner, UserRole.manager)
  @Get("campgrounds/:campgroundId/upsells")
  list(@Param("campgroundId") campgroundId: string) {
    return this.upsells.list(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Post("campgrounds/:campgroundId/upsells")
  create(@Param("campgroundId") campgroundId: string, @Body() dto: CreateUpsellDto) {
    return this.upsells.create(campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Patch("upsells/:id")
  update(@Param("id") id: string, @Body() dto: UpdateUpsellDto) {
    return this.upsells.update(id, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Delete("upsells/:id")
  remove(@Param("id") id: string) {
    return this.upsells.remove(id);
  }
}

