import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { OtaService } from "./ota.service";

@Controller("ota/ical")
export class OtaPublicController {
  constructor(private readonly ota: OtaService) {}

  @Get(":token")
  async feed(@Param("token") token: string, @Res() res: Response) {
    const ics = await this.ota.getIcsFeed(token);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.send(ics);
  }
}
