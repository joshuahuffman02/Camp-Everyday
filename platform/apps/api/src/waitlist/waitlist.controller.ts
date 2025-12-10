import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto } from '@campreserv/shared';
import { JwtAuthGuard } from '../auth/guards';

interface CreateStaffWaitlistDto {
    campgroundId: string;
    type: 'regular' | 'seasonal';
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    siteId?: string;
    siteTypeId?: string;
    arrivalDate?: string;
    departureDate?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('waitlist')
export class WaitlistController {
    constructor(private readonly waitlistService: WaitlistService) { }

    @Post()
    create(@Body() createWaitlistDto: CreateWaitlistEntryDto) {
        return this.waitlistService.create(createWaitlistDto);
    }

    @Post('staff')
    createStaffEntry(@Body() dto: CreateStaffWaitlistDto) {
        return this.waitlistService.createStaffEntry(dto);
    }

    @Get()
    findAll(
        @Query('campgroundId') campgroundId: string,
        @Query('type') type?: string,
    ) {
        return this.waitlistService.findAll(campgroundId, type);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.waitlistService.remove(id);
    }
}
