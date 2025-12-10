import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TaxRulesService } from './tax-rules.service';
import { TaxRuleType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('tax-rules')
export class TaxRulesController {
    constructor(private readonly taxRulesService: TaxRulesService) { }

    @Post()
    create(@Body() body: {
        campgroundId: string;
        name: string;
        type: TaxRuleType;
        rate?: number;
        minNights?: number;
        maxNights?: number;
        requiresWaiver?: boolean;
        waiverText?: string;
    }) {
        return this.taxRulesService.create(body);
    }

    @Get('campground/:campgroundId')
    findAllByCampground(@Param('campgroundId') campgroundId: string) {
        return this.taxRulesService.findAllByCampground(campgroundId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.taxRulesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Partial<{
        name: string;
        type: TaxRuleType;
        rate: number;
        minNights: number;
        maxNights: number;
        requiresWaiver: boolean;
        waiverText: string;
        isActive: boolean;
    }>) {
        return this.taxRulesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.taxRulesService.remove(id);
    }
}
