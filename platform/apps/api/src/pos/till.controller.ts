import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { TillService } from "./till.service";
import { CloseTillDto, OpenTillDto, TillMovementDto, ListTillsDto } from "./till.dto";

@UseGuards(JwtAuthGuard)
@Controller("pos/tills")
export class TillController {
  constructor(private readonly service: TillService) {}

  @Post("open")
  open(@Body() dto: OpenTillDto, @Req() req: any) {
    return this.service.open(dto, req.user);
  }

  @Get()
  list(@Query() query: ListTillsDto, @Req() req: any) {
    return this.service.list(query, req.user);
  }

  @Get(":id")
  get(@Param("id") id: string, @Req() req: any) {
    return this.service.get(id, req.user);
  }

  @Post(":id/close")
  close(@Param("id") id: string, @Body() dto: CloseTillDto, @Req() req: any) {
    return this.service.close(id, dto, req.user);
  }

  @Post(":id/paid-in")
  paidIn(@Param("id") id: string, @Body() dto: TillMovementDto, @Req() req: any) {
    return this.service.paidIn(id, dto, req.user);
  }

  @Post(":id/paid-out")
  paidOut(@Param("id") id: string, @Body() dto: TillMovementDto, @Req() req: any) {
    return this.service.paidOut(id, dto, req.user);
  }
}
