import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { SiteType } from "@prisma/client";

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.site.findUnique({
      where: { id },
      include: {
        siteClass: true,
        campground: true
      }
    });
  }

  listByCampground(campgroundId: string) {
    return this.prisma.site.findMany({
      where: { campgroundId },
      include: { siteClass: true }
    });
  }

  create(data: CreateSiteDto) {
    return this.prisma.site.create({ data: { ...data, siteType: data.siteType as SiteType } });
  }

  update(id: string, data: Partial<CreateSiteDto>) {
    const { campgroundId, siteType, ...rest } = data;
    return this.prisma.site.update({
      where: { id },
      data: {
        ...rest,
        ...(siteType ? { siteType: siteType as SiteType } : {}),
        ...(rest.siteClassId === null ? { siteClassId: null } : {})
      }
    });
  }

  remove(id: string) {
    return this.prisma.site.delete({ where: { id } });
  }
}
