import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { RepeatChargesService } from './repeat-charges.service';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('repeat-charges')
export class RepeatChargesController {
    constructor(private readonly repeatChargesService: RepeatChargesService) { }

    @Get()
    findAll(@Query('campgroundId') campgroundId: string) {
        return this.repeatChargesService.getAllCharges(campgroundId);
    }

    @Get('reservation/:id')
    findByReservation(@Param('id') id: string) {
        return this.repeatChargesService.getCharges(id);
    }

    @Post('reservation/:id/generate')
    generate(@Param('id') id: string) {
        return this.repeatChargesService.generateCharges(id);
    }

    @Post(':id/process')
    process(@Param('id') id: string) {
        return this.repeatChargesService.processCharge(id);
    }
}
