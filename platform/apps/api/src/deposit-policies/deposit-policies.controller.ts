import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { DepositPoliciesService } from "./deposit-policies.service";
import { CreateDepositPolicyDto } from "./dto/create-deposit-policy.dto";
import { UpdateDepositPolicyDto } from "./dto/update-deposit-policy.dto";
import { JwtAuthGuard } from "../auth/guards";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DepositPoliciesController {
  constructor(private readonly depositPolicies: DepositPoliciesService) {}

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Get("campgrounds/:campgroundId/deposit-policies")
  list(@Param("campgroundId") campgroundId: string) {
    return this.depositPolicies.list(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Post("campgrounds/:campgroundId/deposit-policies")
  create(@Param("campgroundId") campgroundId: string, @Body() dto: CreateDepositPolicyDto) {
    return this.depositPolicies.create(campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Patch("deposit-policies/:id")
  update(@Param("id") id: string, @Body() dto: UpdateDepositPolicyDto) {
    return this.depositPolicies.update(id, dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.finance)
  @Delete("deposit-policies/:id")
  remove(@Param("id") id: string) {
    return this.depositPolicies.remove(id);
  }
}

