import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGuestDto } from "./dto/create-guest.dto";

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) { }

  findOne(id: string, campgroundId?: string) {
    const campgroundTag = campgroundId ? `campground:${campgroundId}` : null;
    return this.prisma.guest.findFirst({
      where: {
        id,
        ...(campgroundId
          ? {
              OR: [
                { reservations: { some: { campgroundId } } },
                { tags: { has: campgroundTag } }
              ]
            }
          : {})
      },
      include: {
        loyaltyProfile: true,
        reservations: {
          orderBy: { arrivalDate: "desc" },
          ...(campgroundId ? { where: { campgroundId } } : {}),
          include: {
            site: { include: { siteClass: true } }
          }
        }
      }
    });
  }

  findAll() {
    return this.prisma.guest.findMany({
      orderBy: { primaryLastName: "asc" },
      include: {
        loyaltyProfile: true,
        reservations: {
          orderBy: { departureDate: "desc" },
          take: 1,
          select: {
            departureDate: true,
            site: {
              select: { id: true, name: true, siteNumber: true, siteClassId: true }
            }
          }
        }
      }
    });
  }

  findAllByCampground(campgroundId: string) {
    const campgroundTag = `campground:${campgroundId}`;
    return this.prisma.guest.findMany({
      where: {
        OR: [
          { reservations: { some: { campgroundId } } },
          { tags: { has: campgroundTag } }
        ]
      },
      orderBy: { primaryLastName: "asc" },
      include: {
        loyaltyProfile: true,
        reservations: {
          orderBy: { departureDate: "desc" },
          take: 1,
          where: { campgroundId },
          select: {
            departureDate: true,
            site: {
              select: { id: true, name: true, siteNumber: true, siteClassId: true }
            }
          }
        }
      }
    });
  }

  async create(data: CreateGuestDto) {
    const { rigLength, repeatStays, tags, ...rest } = data as any;
    const emailNormalized = rest.email ? rest.email.trim().toLowerCase() : null;
    const phoneNormalized = rest.phone ? rest.phone.replace(/\D/g, "").slice(-10) : null;
    const incomingTags = Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];

    // Global guest lookup: if email or phone already exists, reuse that guest.
    const existing = await this.prisma.guest.findFirst({
      where: {
        OR: [
          ...(emailNormalized ? [{ emailNormalized }] : []),
          ...(phoneNormalized ? [{ phoneNormalized }] : [])
        ]
      }
    });
    if (existing) {
      if (incomingTags.length > 0) {
        const nextTags = Array.from(new Set([...(existing.tags ?? []), ...incomingTags]));
        if (nextTags.length !== (existing.tags ?? []).length) {
          return this.prisma.guest.update({
            where: { id: existing.id },
            data: { tags: nextTags }
          });
        }
      }
      return existing;
    }

    return this.prisma.guest.create({
      data: {
        ...rest,
        ...(incomingTags.length ? { tags: incomingTags } : {}),
        emailNormalized,
        phoneNormalized,
        rigLength: rigLength !== undefined ? Number(rigLength) : null,
        repeatStays: repeatStays !== undefined ? Number(repeatStays) : undefined
      }
    });
  }

  update(id: string, data: Partial<CreateGuestDto>) {
    const { rigLength, repeatStays, ...rest } = data as any;
    const emailNormalized = rest.email ? rest.email.trim().toLowerCase() : undefined;
    const phoneNormalized = rest.phone ? rest.phone.replace(/\D/g, "").slice(-10) : undefined;
    return this.prisma.guest.update({
      where: { id },
      data: {
        ...rest,
        ...(emailNormalized !== undefined ? { emailNormalized } : {}),
        ...(phoneNormalized !== undefined ? { phoneNormalized } : {}),
        ...(rigLength !== undefined ? { rigLength: rigLength === null ? null : Number(rigLength) } : {}),
        ...(repeatStays !== undefined ? { repeatStays: repeatStays === null ? null : Number(repeatStays) } : {})
      }
    });
  }

  remove(id: string) {
    return this.prisma.guest.delete({ where: { id } });
  }
}
