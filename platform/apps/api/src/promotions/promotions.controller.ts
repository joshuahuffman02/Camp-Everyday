import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto, UpdatePromotionDto, ValidatePromotionDto } from "./dto/promotions.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller("promotions")
export class PromotionsController {
    constructor(private readonly promotionsService: PromotionsService) { }

    @Post()
    create(@Body() createPromotionDto: CreatePromotionDto) {
        return this.promotionsService.create(createPromotionDto);
    }

    @Get("campgrounds/:campgroundId")
    findAll(@Param("campgroundId") campgroundId: string) {
        return this.promotionsService.findAll(campgroundId);
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.promotionsService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
        return this.promotionsService.update(id, updatePromotionDto);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.promotionsService.remove(id);
    }

    @Post("validate")
    validate(@Body() validatePromotionDto: ValidatePromotionDto) {
        return this.promotionsService.validate(validatePromotionDto);
    }
}
