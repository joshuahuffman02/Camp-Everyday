import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { DynamicPricingService } from './dynamic-pricing.service';

@Controller('dynamic-pricing')
@UseGuards(JwtAuthGuard)
export class DynamicPricingController {
  constructor(private readonly service: DynamicPricingService) {}

  @Post('rules')
  createRule(@Body() dto: any) {
    return this.service.createRule(dto);
  }

  @Get('rules')
  listRules(
    @Query('campgroundId') campgroundId: string,
    @Query('includeInactive') includeInactive?: string
  ) {
    return this.service.listRules(campgroundId, includeInactive === 'true');
  }

  @Get('rules/:id')
  getRule(@Param('id') id: string) {
    return this.service.getRule(id);
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateRule(id, dto);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.service.deleteRule(id);
  }

  @Get('calculate')
  calculateAdjustment(
    @Query('campgroundId') campgroundId: string,
    @Query('siteClassId') siteClassId: string | null,
    @Query('date') date: string,
    @Query('basePrice') basePrice: string
  ) {
    return this.service.calculateAdjustment(
      campgroundId,
      siteClassId,
      new Date(date),
      parseInt(basePrice, 10)
    );
  }

  @Post('occupancy-snapshot')
  recordOccupancySnapshot(
    @Body() dto: { campgroundId: string; date: string }
  ) {
    return this.service.recordOccupancySnapshot(dto.campgroundId, new Date(dto.date));
  }

  @Get('occupancy')
  getOccupancy(
    @Query('campgroundId') campgroundId: string,
    @Query('date') date: string
  ) {
    return this.service.getOccupancyForDate(campgroundId, new Date(date));
  }

  @Post('forecasts/generate')
  generateForecast(
    @Body() dto: { campgroundId: string; daysAhead?: number }
  ) {
    return this.service.generateForecast(dto.campgroundId, dto.daysAhead);
  }

  @Get('forecasts')
  getForecasts(
    @Query('campgroundId') campgroundId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.service.getForecasts(
      campgroundId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}

