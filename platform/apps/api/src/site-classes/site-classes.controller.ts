import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SiteClassesService } from "./site-classes.service";
import { CreateSiteClassDto } from "./dto/create-site-class.dto";
import { JwtAuthGuard } from "../auth/guards";

@UseGuards(JwtAuthGuard)
@Controller()
export class SiteClassesController {
  constructor(private readonly siteClasses: SiteClassesService) { }

  @Get("campgrounds/:campgroundId/site-classes")
  list(@Param("campgroundId") campgroundId: string) {
    return this.siteClasses.listByCampground(campgroundId);
  }

  @Get("site-classes/:id")
  getById(@Param("id") id: string) {
    return this.siteClasses.findOne(id);
  }

  @Post("campgrounds/:campgroundId/site-classes")
  create(@Param("campgroundId") campgroundId: string, @Body() body: Omit<CreateSiteClassDto, "campgroundId">) {
    return this.siteClasses.create({ campgroundId, ...body });
  }

  @Patch("site-classes/:id")
  update(@Param("id") id: string, @Body() body: Partial<CreateSiteClassDto>) {
    return this.siteClasses.update(id, body);
  }

  @Delete("site-classes/:id")
  remove(@Param("id") id: string) {
    return this.siteClasses.remove(id);
  }
}
