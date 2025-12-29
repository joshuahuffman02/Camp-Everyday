import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { ScopeGuard } from "../auth/guards/scope.guard";
import { WaitlistService } from "./waitlist.service";

@UseGuards(JwtAuthGuard, ScopeGuard)
@Controller("campgrounds/:campgroundId/waitlist")
export class WaitlistStatsController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get("stats")
  getStats(@Param("campgroundId") campgroundId: string) {
    return this.waitlistService.getStats(campgroundId);
  }
}
