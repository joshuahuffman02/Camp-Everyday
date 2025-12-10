import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { GuestsService } from "./guests.service";
import { CreateGuestDto } from "./dto/create-guest.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller("guests")
export class GuestsController {
  constructor(private readonly guests: GuestsService) { }

  @Get()
  findAll() {
    return this.guests.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.guests.findOne(id);
  }

  @Post()
  create(@Body() body: CreateGuestDto) {
    return this.guests.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Partial<CreateGuestDto>) {
    return this.guests.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.guests.remove(id);
  }
}
