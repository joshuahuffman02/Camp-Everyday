import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { SiteMapService } from "./site-map.service";
import { UpsertMapDto } from "./dto/upsert-map.dto";
import { CheckAssignmentDto } from "./dto/check-assignment.dto";
import { PreviewAssignmentsDto } from "./dto/preview-assignments.dto";
import { UploadsService } from "../uploads/uploads.service";

const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

type MapUploadPayload = {
  url?: string;
  dataUrl?: string;
  contentType?: string;
  filename?: string;
};

const parseDataUrl = (dataUrl: string) => {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class SiteMapController {
  constructor(
    private readonly siteMap: SiteMapService,
    private readonly uploads: UploadsService
  ) { }

  @Get("campgrounds/:campgroundId/map")
  getMap(
    @Param("campgroundId") campgroundId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.siteMap.getMap(campgroundId, startDate, endDate);
  }

  @Put("campgrounds/:campgroundId/map")
  upsertMap(@Param("campgroundId") campgroundId: string, @Body() body: UpsertMapDto) {
    return this.siteMap.upsertMap(campgroundId, body);
  }

  @Post("campgrounds/:campgroundId/map")
  async uploadMap(
    @Param("campgroundId") campgroundId: string,
    @Body() body: MapUploadPayload
  ) {
    if (body?.url) {
      return this.siteMap.setBaseImage(campgroundId, body.url);
    }

    if (!body?.dataUrl) {
      throw new BadRequestException("url or dataUrl is required");
    }

    const parsed = parseDataUrl(body.dataUrl);
    if (!parsed) {
      throw new BadRequestException("dataUrl must be base64 encoded");
    }

    const contentType = body.contentType || parsed.contentType || "application/octet-stream";
    const buffer = parsed.buffer;

    if (!buffer.length) {
      throw new BadRequestException("dataUrl is empty");
    }

    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException("File too large. Max 18MB.");
    }

    const extension = body.filename?.includes(".") ? body.filename.split(".").pop() : undefined;
    const uploaded = await this.uploads.uploadBuffer(buffer, {
      contentType,
      extension,
      prefix: "campground-maps"
    });

    return this.siteMap.setBaseImage(campgroundId, uploaded.url);
  }

  @Post("campgrounds/:campgroundId/assignments/check")
  check(@Param("campgroundId") campgroundId: string, @Body() body: CheckAssignmentDto) {
    return this.siteMap.checkAssignment(campgroundId, body);
  }

  @Post("campgrounds/:campgroundId/assignments/preview")
  preview(@Param("campgroundId") campgroundId: string, @Body() body: PreviewAssignmentsDto) {
    return this.siteMap.previewAssignments(campgroundId, body);
  }
}
