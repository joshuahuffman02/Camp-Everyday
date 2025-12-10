import { Controller, Get } from "@nestjs/common";
import { PerfService } from "./perf.service";

@Controller("ops/perf")
export class PerfController {
  constructor(private readonly perfService: PerfService) {}

  @Get()
  getSnapshot() {
    return this.perfService.getSnapshot();
  }
}

