import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import {
  CharityService,
  CreateCharityDto,
  UpdateCharityDto,
  SetCampgroundCharityDto,
} from "./charity.service";
import { DonationStatus, CharityPayoutStatus } from "@prisma/client";

@Controller("charity")
export class CharityController {
  constructor(private charityService: CharityService) {}

  // ==========================================================================
  // CHARITY CRUD (Platform Admin)
  // ==========================================================================

  @Get()
  async listCharities(
    @Query("category") category?: string,
    @Query("activeOnly") activeOnly?: string
  ) {
    return this.charityService.listCharities({
      category,
      activeOnly: activeOnly !== "false",
    });
  }

  @Get("categories")
  async getCategories() {
    return this.charityService.getCharityCategories();
  }

  @Get(":id")
  async getCharity(@Param("id") id: string) {
    return this.charityService.getCharity(id);
  }

  @Post()
  async createCharity(@Body() data: CreateCharityDto) {
    return this.charityService.createCharity(data);
  }

  @Put(":id")
  async updateCharity(@Param("id") id: string, @Body() data: UpdateCharityDto) {
    return this.charityService.updateCharity(id, data);
  }

  @Delete(":id")
  async deleteCharity(@Param("id") id: string) {
    return this.charityService.deleteCharity(id);
  }

  // ==========================================================================
  // PLATFORM STATS
  // ==========================================================================

  @Get("stats/platform")
  async getPlatformStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.charityService.getPlatformDonationStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  // ==========================================================================
  // PAYOUTS
  // ==========================================================================

  @Get("payouts")
  async listPayouts(
    @Query("charityId") charityId?: string,
    @Query("status") status?: CharityPayoutStatus,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.charityService.listPayouts({
      charityId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post("payouts")
  async createPayout(
    @Body() data: { charityId: string; createdBy?: string }
  ) {
    return this.charityService.createPayout(data.charityId, data.createdBy);
  }

  @Put("payouts/:id/complete")
  async completePayout(
    @Param("id") id: string,
    @Body() data: { reference?: string; notes?: string }
  ) {
    return this.charityService.completePayout(id, data.reference, data.notes);
  }
}

// Campground-specific charity endpoints
@Controller("campgrounds/:campgroundId/charity")
export class CampgroundCharityController {
  constructor(private charityService: CharityService) {}

  @Get()
  async getCampgroundCharity(@Param("campgroundId") campgroundId: string) {
    return this.charityService.getCampgroundCharity(campgroundId);
  }

  @Put()
  async setCampgroundCharity(
    @Param("campgroundId") campgroundId: string,
    @Body() data: SetCampgroundCharityDto
  ) {
    return this.charityService.setCampgroundCharity(campgroundId, data);
  }

  @Delete()
  async disableCampgroundCharity(@Param("campgroundId") campgroundId: string) {
    return this.charityService.disableCampgroundCharity(campgroundId);
  }

  @Get("stats")
  async getCampgroundStats(
    @Param("campgroundId") campgroundId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.charityService.getCampgroundDonationStats(
      campgroundId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get("donations")
  async listCampgroundDonations(
    @Param("campgroundId") campgroundId: string,
    @Query("status") status?: DonationStatus,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.charityService.listDonations({
      campgroundId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("round-up")
  async calculateRoundUp(
    @Param("campgroundId") campgroundId: string,
    @Query("totalCents") totalCents: string
  ) {
    const settings = await this.charityService.getCampgroundCharity(campgroundId);

    if (!settings || !settings.isEnabled) {
      return { enabled: false };
    }

    const roundUp = this.charityService.calculateRoundUp(
      parseInt(totalCents, 10),
      settings.roundUpType,
      settings.roundUpOptions as { values: number[] } | undefined
    );

    return {
      enabled: true,
      charity: {
        id: settings.charity.id,
        name: settings.charity.name,
        description: settings.charity.description,
        logoUrl: settings.charity.logoUrl,
      },
      customMessage: settings.customMessage,
      roundUpType: settings.roundUpType,
      roundUpOptions: settings.roundUpOptions,
      defaultOptIn: settings.defaultOptIn,
      ...roundUp,
    };
  }
}
