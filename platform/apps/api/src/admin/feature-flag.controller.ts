import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { FeatureFlagService } from "./feature-flag.service";

class CreateFeatureFlagDto {
    key!: string;
    name!: string;
    description?: string;
    enabled?: boolean;
    scope?: "global" | "campground";
    campgrounds?: string[];
}

class UpdateFeatureFlagDto {
    name?: string;
    description?: string;
    enabled?: boolean;
    scope?: "global" | "campground";
    campgrounds?: string[];
}

@Controller("admin/flags")
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
    constructor(private readonly flags: FeatureFlagService) { }

    @Get()
    async list() {
        return this.flags.findAll();
    }

    @Get(":id")
    async get(@Param("id") id: string) {
        return this.flags.findOne(id);
    }

    @Post()
    async create(@Body() dto: CreateFeatureFlagDto) {
        return this.flags.create(dto);
    }

    @Patch(":id")
    async update(@Param("id") id: string, @Body() dto: UpdateFeatureFlagDto) {
        return this.flags.update(id, dto);
    }

    @Patch(":id/toggle")
    async toggle(@Param("id") id: string) {
        return this.flags.toggle(id);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        return this.flags.delete(id);
    }
}
