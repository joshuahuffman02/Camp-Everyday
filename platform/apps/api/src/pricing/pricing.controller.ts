import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PricingService } from "./pricing.service";
import { CreatePricingRuleDto } from "./dto/create-pricing-rule.dto";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PricingController {
  constructor(private readonly pricing: PricingService) { }

  @Roles(UserRole.owner, UserRole.manager)
  @Get("campgrounds/:campgroundId/pricing-rules")
  list(@Param("campgroundId") campgroundId: string) {
    return this.pricing.listByCampground(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Post("campgrounds/:campgroundId/pricing-rules")
  create(@Param("campgroundId") campgroundId: string, @Body() dto: CreatePricingRuleDto) {
    return this.pricing.create(campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Patch("pricing-rules/:id")
  update(@Param("id") id: string, @Body() dto: Partial<CreatePricingRuleDto>) {
    return this.pricing.update(id, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Delete("pricing-rules/:id")
  remove(@Param("id") id: string) {
    return this.pricing.remove(id);
  }
}
