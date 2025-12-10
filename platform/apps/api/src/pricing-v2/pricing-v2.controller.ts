import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { PricingV2Service } from "./pricing-v2.service";
import { CreatePricingRuleV2Dto } from "./dto/create-pricing-rule-v2.dto";
import { UpdatePricingRuleV2Dto } from "./dto/update-pricing-rule-v2.dto";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PricingV2Controller {
  constructor(private readonly pricing: PricingV2Service) {}

  @Roles(UserRole.owner, UserRole.manager)
  @Get("campgrounds/:campgroundId/pricing-rules/v2")
  list(@Param("campgroundId") campgroundId: string) {
    return this.pricing.list(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Post("campgrounds/:campgroundId/pricing-rules/v2")
  create(@Param("campgroundId") campgroundId: string, @Body() dto: CreatePricingRuleV2Dto) {
    return this.pricing.create(campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Patch("pricing-rules/v2/:id")
  update(@Param("id") id: string, @Body() dto: UpdatePricingRuleV2Dto) {
    return this.pricing.update(id, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Delete("pricing-rules/v2/:id")
  remove(@Param("id") id: string) {
    return this.pricing.remove(id);
  }
}

