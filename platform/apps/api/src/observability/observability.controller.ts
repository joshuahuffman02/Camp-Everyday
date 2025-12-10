import { Controller, Get } from "@nestjs/common";
import { ObservabilityService } from "./observability.service";

@Controller("observability")
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) { }

  @Get("snapshot")
  getSnapshot() {
    return this.observability.snapshot();
  }
}

