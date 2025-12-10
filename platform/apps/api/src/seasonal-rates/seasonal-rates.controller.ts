import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SeasonalRatesService } from './seasonal-rates.service';
import { RateType, PaymentSchedule, PricingStructure } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('seasonal-rates')
export class SeasonalRatesController {
    constructor(private readonly seasonalRatesService: SeasonalRatesService) { }

    @Post()
    create(@Body() body: {
        campgroundId: string;
        siteClassId?: string;
        name: string;
        rateType: RateType;
        amount: number;
        minNights?: number;
        startDate?: Date;
        endDate?: Date;
        paymentSchedule?: PaymentSchedule;
        pricingStructure?: PricingStructure;
        offseasonInterval?: number;
        offseasonAmount?: number;
        prorateExcess?: boolean;
    }) {
        return this.seasonalRatesService.create(body);
    }

    @Get('campground/:campgroundId')
    findAllByCampground(@Param('campgroundId') campgroundId: string) {
        return this.seasonalRatesService.findAllByCampground(campgroundId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.seasonalRatesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Partial<{
        name: string;
        rateType: RateType;
        amount: number;
        minNights: number;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        paymentSchedule: PaymentSchedule;
        pricingStructure: PricingStructure;
        offseasonInterval: number;
        offseasonAmount: number;
        prorateExcess: boolean;
    }>) {
        return this.seasonalRatesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.seasonalRatesService.remove(id);
    }
}
