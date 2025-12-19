import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import * as path from "path";
import { JwtAuthGuard } from "../auth/guards";
import { SiteMapService } from "./site-map.service";
import { UpsertMapDto } from "./dto/upsert-map.dto";
import { CheckAssignmentDto } from "./dto/check-assignment.dto";
import { PreviewAssignmentsDto } from "./dto/preview-assignments.dto";
import { UploadsService } from "../uploads/uploads.service";

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
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }
    })
  )
  async uploadMap(
    @Param("campgroundId") campgroundId: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf"
    ]);
    if (!allowedTypes.has(file.mimetype)) {
      throw new BadRequestException("Unsupported file type");
    }

    const ext = path.extname(file.originalname || "").replace(".", "") || undefined;
    const upload = await this.uploads.uploadBuffer(file.buffer, {
      contentType: file.mimetype,
      extension: ext,
      prefix: "campground-maps"
    });
    return this.siteMap.setBaseImage(campgroundId, upload.url);
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
