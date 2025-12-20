import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { Roles, RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "@prisma/client";
import { PoliciesService } from "./policies.service";
import { CreatePolicyTemplateDto } from "./dto/create-policy-template.dto";
import { UpdatePolicyTemplateDto } from "./dto/update-policy-template.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk, UserRole.finance, UserRole.readonly)
  @Get("campgrounds/:campgroundId/policy-templates")
  list(@Param("campgroundId") campgroundId: string) {
    return this.policies.listTemplates(campgroundId);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  @Post("campgrounds/:campgroundId/policy-templates")
  create(@Param("campgroundId") campgroundId: string, @Body() dto: CreatePolicyTemplateDto) {
    return this.policies.createTemplate(campgroundId, dto);
  }

  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  @Patch("policy-templates/:id")
  update(@Param("id") id: string, @Body() dto: UpdatePolicyTemplateDto) {
    return this.policies.updateTemplate(id, dto);
  }

  @Roles(UserRole.owner, UserRole.manager)
  @Delete("policy-templates/:id")
  remove(@Param("id") id: string) {
    return this.policies.removeTemplate(id);
  }
}
