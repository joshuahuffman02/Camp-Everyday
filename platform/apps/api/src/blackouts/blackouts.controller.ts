import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { BlackoutsService } from "./blackouts.service";
import { CreateBlackoutDateDto, UpdateBlackoutDateDto } from "./dto/blackout.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller("blackouts")
export class BlackoutsController {
    constructor(private readonly blackoutsService: BlackoutsService) { }

    @Post()
    create(@Body() createBlackoutDateDto: CreateBlackoutDateDto) {
        return this.blackoutsService.create(createBlackoutDateDto);
    }

    @Get("campgrounds/:campgroundId")
    findAll(@Param("campgroundId") campgroundId: string) {
        return this.blackoutsService.findAll(campgroundId);
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.blackoutsService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() updateBlackoutDateDto: UpdateBlackoutDateDto) {
        return this.blackoutsService.update(id, updateBlackoutDateDto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.blackoutsService.remove(id);
    }
}
