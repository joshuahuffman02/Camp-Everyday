import { Global, Module } from "@nestjs/common";
import { ObservabilityController } from "./observability.controller";
import { ObservabilityService } from "./observability.service";
import { JobQueueService } from "./job-queue.service";

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    JobQueueService,
  ],
  exports: [ObservabilityService, JobQueueService],
})
export class ObservabilityModule { }

