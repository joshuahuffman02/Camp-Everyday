import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards';
import {
    CreateActivityDto,
    UpdateActivityDto,
    CreateSessionDto,
    BookActivityDto,
    UpdateCapacityDto,
    AddWaitlistEntryDto,
} from './dto/activities.dto';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    create(@Body() createActivityDto: CreateActivityDto) {
        const { campgroundId, ...data } = createActivityDto;
        return this.activitiesService.createActivity(campgroundId, data);
    }

    @Get()
    findAll(@Query('campgroundId') campgroundId: string) {
        return this.activitiesService.findAllActivities(campgroundId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.activitiesService.findActivity(id);
    }

    @Get(':id/capacity')
    getCapacity(@Param('id') id: string) {
        return this.activitiesService.getCapacitySnapshot(id);
    }

    @Patch(':id/capacity')
    updateCapacity(@Param('id') id: string, @Body() dto: UpdateCapacityDto) {
        return this.activitiesService.updateCapacitySettings(id, dto);
    }

    @Post(':id/waitlist')
    addWaitlist(@Param('id') id: string, @Body() dto: AddWaitlistEntryDto) {
        return this.activitiesService.addWaitlistEntry(id, dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
        return this.activitiesService.updateActivity(id, updateActivityDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.activitiesService.deleteActivity(id);
    }

    // Sessions
    @Post(':id/sessions')
    createSession(@Param('id') id: string, @Body() createSessionDto: CreateSessionDto) {
        return this.activitiesService.createSession(id, createSessionDto);
    }

    @Get(':id/sessions')
    findSessions(@Param('id') id: string) {
        return this.activitiesService.findSessions(id);
    }

    // Bookings
    @Post('sessions/:id/book')
    createBooking(
        @Param('id') sessionId: string,
        @Body() bookingDto: BookActivityDto,
    ) {
        return this.activitiesService.createBooking(
            sessionId,
            bookingDto.guestId,
            bookingDto.quantity,
            bookingDto.reservationId,
        );
    }

    @Post('bookings/:id/cancel')
    cancelBooking(@Param('id') id: string) {
        return this.activitiesService.cancelBooking(id);
    }
}
