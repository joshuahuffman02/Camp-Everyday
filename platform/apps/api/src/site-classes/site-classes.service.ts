import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSiteClassDto } from "./dto/create-site-class.dto";
import { SiteType } from "@prisma/client";

@Injectable()
export class SiteClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.siteClass.findUnique({
      where: { id },
      include: {
        campground: true
      }
    });
  }

  listByCampground(campgroundId: string) {
    return this.prisma.siteClass.findMany({ where: { campgroundId }, orderBy: { name: "asc" } });
  }

  create(data: CreateSiteClassDto) {
    return this.prisma.siteClass.create({ data: { ...data, siteType: data.siteType as SiteType } });
  }

  update(id: string, data: Partial<CreateSiteClassDto>) {
    const { campgroundId, siteType, ...rest } = data;
    return this.prisma.siteClass.update({
      where: { id },
      data: {
        ...rest,
        ...(siteType ? { siteType: siteType as SiteType } : {})
      }
    });
  }

  remove(id: string) {
    return this.prisma.siteClass.delete({ where: { id } });
  }
}
