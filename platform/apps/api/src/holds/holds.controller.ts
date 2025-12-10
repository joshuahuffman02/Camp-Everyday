import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { HoldsService } from "./holds.service";
import { CreateHoldDto } from "./dto/create-hold.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller("holds")
export class HoldsController {
  constructor(private readonly holds: HoldsService) { }

  @Post()
  create(@Body() dto: CreateHoldDto) {
    return this.holds.create(dto);
  }

  @Get("campgrounds/:campgroundId")
  list(@Param("campgroundId") campgroundId: string) {
    return this.holds.listByCampground(campgroundId);
  }

  @Delete(":id")
  release(@Param("id") id: string) {
    return this.holds.release(id);
  }

  @Post("expire")
  expireStale() {
    return this.holds.expireStale();
  }
}

