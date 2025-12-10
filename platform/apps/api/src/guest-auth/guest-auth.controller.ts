import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { GuestAuthService } from './guest-auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('guest-auth')
export class GuestAuthController {
    constructor(private readonly guestAuthService: GuestAuthService) { }

    @Post('magic-link')
    async sendMagicLink(@Body('email') email: string) {
        return this.guestAuthService.sendMagicLink(email);
    }

    @Post('verify')
    async verifyToken(@Body('token') token: string) {
        return this.guestAuthService.verifyToken(token);
    }

    @Get('me')
    @UseGuards(AuthGuard('guest-jwt'))
    async getMe(@Request() req: any) {
        return this.guestAuthService.getMe(req.user.id);
    }
}
