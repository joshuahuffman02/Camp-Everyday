import {
  Body,
  Controller,
  Post,
  Param,
  BadRequestException,
  Headers,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  ReservationImportService,
  ReservationImportColumnMapping,
  ReservationImportExecuteRow,
  ParsedReservationRow,
} from "./reservation-import.service";

// ============ DTOs ============

class UploadDto {
  csvContent!: string;
}

class PreviewDto {
  csvContent!: string;
  mapping!: ReservationImportColumnMapping;
}

class ExecuteDto {
  csvContent!: string;
  mapping!: ReservationImportColumnMapping;
  rows!: ReservationImportExecuteRow[];
}

// ============ Controller ============

/**
 * Reservation Import Controller
 *
 * These endpoints are designed to work with or without JWT auth,
 * since they may be called during onboarding with just the onboarding token.
 */
@Controller()
export class ReservationImportController {
  constructor(
    private readonly reservationImport: ReservationImportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Upload CSV and get initial parse with auto-detected column mapping
   */
  @Post("campgrounds/:campgroundId/import/reservations/upload")
  async upload(
    @Param("campgroundId") campgroundId: string,
    @Body() body: UploadDto,
    @Headers("x-onboarding-token") onboardingToken?: string,
  ) {
    await this.validateCampgroundAccess(campgroundId, onboardingToken);

    if (!body.csvContent) {
      throw new BadRequestException("CSV content is required");
    }

    return this.reservationImport.parseAndDetectColumns(
      body.csvContent,
      campgroundId
    );
  }

  /**
   * Preview import with full matching and pricing comparison
   */
  @Post("campgrounds/:campgroundId/import/reservations/preview")
  async preview(
    @Param("campgroundId") campgroundId: string,
    @Body() body: PreviewDto,
    @Headers("x-onboarding-token") onboardingToken?: string,
  ) {
    await this.validateCampgroundAccess(campgroundId, onboardingToken);

    if (!body.csvContent) {
      throw new BadRequestException("CSV content is required");
    }

    if (!body.mapping || !body.mapping.arrivalDate || !body.mapping.departureDate) {
      throw new BadRequestException("Column mapping with at least arrivalDate and departureDate is required");
    }

    return this.reservationImport.previewImport(
      campgroundId,
      body.csvContent,
      body.mapping
    );
  }

  /**
   * Execute the import with user's selections
   */
  @Post("campgrounds/:campgroundId/import/reservations/execute")
  async execute(
    @Param("campgroundId") campgroundId: string,
    @Body() body: ExecuteDto,
    @Headers("x-onboarding-token") onboardingToken?: string,
  ) {
    await this.validateCampgroundAccess(campgroundId, onboardingToken);

    if (!body.csvContent) {
      throw new BadRequestException("CSV content is required");
    }

    if (!body.mapping) {
      throw new BadRequestException("Column mapping is required");
    }

    if (!body.rows || body.rows.length === 0) {
      throw new BadRequestException("Row selections are required");
    }

    // Re-parse the CSV to get the parsed rows
    const preview = await this.reservationImport.previewImport(
      campgroundId,
      body.csvContent,
      body.mapping
    );

    return this.reservationImport.executeImport(
      campgroundId,
      preview.parsedRows,
      body.rows
    );
  }

  /**
   * Get template CSV for reservation import
   */
  @Post("campgrounds/:campgroundId/import/reservations/template")
  getTemplate() {
    const headers = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "arrival_date",
      "departure_date",
      "site_number",
      "site_class",
      "adults",
      "children",
      "total_amount",
      "paid_amount",
      "confirmation_number",
      "status",
      "notes",
    ];

    const sampleRow = [
      "John",
      "Doe",
      "john@example.com",
      "555-123-4567",
      "2025-01-15",
      "2025-01-18",
      "A1",
      "Full Hookup RV",
      "2",
      "1",
      "150.00",
      "150.00",
      "RES-12345",
      "confirmed",
      "Returning guest",
    ];

    return {
      csv: `${headers.join(",")}\n${sampleRow.join(",")}`,
      headers,
    };
  }

  /**
   * Validate that the request has access to the campground
   * Either via onboarding token or would need JWT (handled by guard)
   */
  private async validateCampgroundAccess(
    campgroundId: string,
    onboardingToken?: string
  ): Promise<void> {
    // If onboarding token provided, validate it matches the campground
    if (onboardingToken) {
      const session = await this.prisma.onboardingSession.findFirst({
        where: { token: onboardingToken },
        select: { campgroundId: true },
      });

      if (!session) {
        throw new BadRequestException("Invalid onboarding token");
      }

      if (session.campgroundId !== campgroundId) {
        throw new BadRequestException("Token does not match campground");
      }

      return;
    }

    // Otherwise, verify campground exists (JWT guard would handle auth)
    const campground = await this.prisma.campground.findUnique({
      where: { id: campgroundId },
      select: { id: true },
    });

    if (!campground) {
      throw new BadRequestException("Campground not found");
    }
  }
}
