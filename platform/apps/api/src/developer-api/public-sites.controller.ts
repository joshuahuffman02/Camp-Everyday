import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTokenGuard } from "./guards/api-token.guard";
import { ApiScopeGuard } from "./guards/api-scope.guard";
import { ApiScopes } from "./decorators/api-scopes.decorator";
import { PublicApiService } from "./public-api.service";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class CreateSiteBody {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() siteNumber!: string;
  @IsString() @IsNotEmpty() siteType!: string;
  @IsNumber() maxOccupancy!: number;
  @IsNumber() @IsOptional() rigMaxLength?: number | null;
}

class UpdateSiteBody {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() siteNumber?: string;
  @IsString() @IsOptional() siteType?: string;
  @IsNumber() @IsOptional() maxOccupancy?: number;
  @IsNumber() @IsOptional() rigMaxLength?: number | null;
}

@Controller("public/sites")
@UseGuards(ApiTokenGuard, ApiScopeGuard)
export class PublicSitesController {
  constructor(private readonly api: PublicApiService) { }

  @Get()
  @ApiScopes("sites:read")
  list(@Req() req: any) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.listSites(campgroundId);
  }

  @Get(":id")
  @ApiScopes("sites:read")
  get(@Req() req: any, @Param("id") id: string) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.getSite(campgroundId, id);
  }

  @Post()
  @ApiScopes("sites:write")
  create(@Req() req: any, @Body() body: CreateSiteBody) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.createSite(campgroundId, body);
  }

  @Patch(":id")
  @ApiScopes("sites:write")
  update(@Req() req: any, @Param("id") id: string, @Body() body: UpdateSiteBody) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.updateSite(campgroundId, id, body);
  }

  @Delete(":id")
  @ApiScopes("sites:write")
  remove(@Req() req: any, @Param("id") id: string) {
    const campgroundId = req.apiPrincipal.campgroundId;
    return this.api.deleteSite(campgroundId, id);
  }
}

