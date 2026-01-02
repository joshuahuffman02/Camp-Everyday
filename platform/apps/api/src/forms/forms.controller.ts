import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { FormsService } from "./forms.service";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth/guards";
import { ScopeGuard } from "../permissions/scope.guard";
import { UserRole } from "@prisma/client";
import { CreateFormTemplateDto, UpdateFormTemplateDto, CreateFormSubmissionDto, UpdateFormSubmissionDto } from "./dto/form-template.dto";

@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Controller()
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get("campgrounds/:campgroundId/forms")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  listByCampground(@Param("campgroundId") campgroundId: string) {
    return this.forms.listByCampground(campgroundId);
  }

  @Post("forms")
  @Roles(UserRole.owner, UserRole.manager)
  create(@Body() body: CreateFormTemplateDto) {
    return this.forms.create(body);
  }

  @Patch("forms/:id")
  @Roles(UserRole.owner, UserRole.manager)
  update(@Param("id") id: string, @Body() body: UpdateFormTemplateDto) {
    return this.forms.update(id, body);
  }

  @Delete("forms/:id")
  @Roles(UserRole.owner, UserRole.manager)
  remove(@Param("id") id: string) {
    return this.forms.remove(id);
  }

  @Get("reservations/:reservationId/forms")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  listForReservation(@Param("reservationId") reservationId: string) {
    return this.forms.listSubmissions({ reservationId });
  }

  @Get("guests/:guestId/forms")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  listForGuest(@Param("guestId") guestId: string) {
    return this.forms.listSubmissions({ guestId });
  }

  @Post("forms/submissions")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  createSubmission(@Body() body: CreateFormSubmissionDto) {
    return this.forms.createSubmission(body);
  }

  @Patch("forms/submissions/:id")
  @Roles(UserRole.owner, UserRole.manager, UserRole.front_desk)
  updateSubmission(@Param("id") id: string, @Body() body: UpdateFormSubmissionDto) {
    return this.forms.updateSubmission(id, body);
  }

  @Delete("forms/submissions/:id")
  @Roles(UserRole.owner, UserRole.manager)
  deleteSubmission(@Param("id") id: string) {
    return this.forms.deleteSubmission(id);
  }
}
