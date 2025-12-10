import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { FormsService } from "./forms.service";
import { JwtAuthGuard } from "../auth/guards";
import { CreateFormTemplateDto, UpdateFormTemplateDto, CreateFormSubmissionDto, UpdateFormSubmissionDto } from "./dto/form-template.dto";

@UseGuards(JwtAuthGuard)
@Controller()
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get("campgrounds/:campgroundId/forms")
  listByCampground(@Param("campgroundId") campgroundId: string) {
    return this.forms.listByCampground(campgroundId);
  }

  @Post("forms")
  create(@Body() body: CreateFormTemplateDto) {
    return this.forms.create(body);
  }

  @Patch("forms/:id")
  update(@Param("id") id: string, @Body() body: UpdateFormTemplateDto) {
    return this.forms.update(id, body);
  }

  @Delete("forms/:id")
  remove(@Param("id") id: string) {
    return this.forms.remove(id);
  }

  @Get("reservations/:reservationId/forms")
  listForReservation(@Param("reservationId") reservationId: string) {
    return this.forms.listSubmissions({ reservationId });
  }

  @Get("guests/:guestId/forms")
  listForGuest(@Param("guestId") guestId: string) {
    return this.forms.listSubmissions({ guestId });
  }

  @Post("forms/submissions")
  createSubmission(@Body() body: CreateFormSubmissionDto) {
    return this.forms.createSubmission(body);
  }

  @Patch("forms/submissions/:id")
  updateSubmission(@Param("id") id: string, @Body() body: UpdateFormSubmissionDto) {
    return this.forms.updateSubmission(id, body);
  }

  @Delete("forms/submissions/:id")
  deleteSubmission(@Param("id") id: string) {
    return this.forms.deleteSubmission(id);
  }
}

