import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UsageTrackerService } from "./usage-tracker.service";

/**
 * Lightweight module for usage tracking.
 * Has minimal dependencies to avoid circular imports.
 *
 * Import this module in services that need to track billable events
 * (reservations, messages, etc.) without pulling in the full billing stack.
 */
@Module({
  imports: [PrismaModule],
  providers: [UsageTrackerService],
  exports: [UsageTrackerService],
})
export class UsageTrackerModule {}
