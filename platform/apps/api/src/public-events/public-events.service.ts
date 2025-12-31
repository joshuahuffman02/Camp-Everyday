import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EventType } from "@prisma/client";

export interface PublicEventResult {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  imageUrl: string | null;
  priceCents: number;
  capacity: number | null;
  currentSignups: number;
  location: string | null;
  campground: {
    id: string;
    slug: string | null;
    name: string;
    city: string | null;
    state: string | null;
    heroImageUrl: string | null;
  };
}

export interface PublicEventSearchResult {
  results: PublicEventResult[];
  total: number;
}

export interface SearchEventsOptions {
  state?: string;
  eventType?: EventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: "date" | "distance";
}

@Injectable()
export class PublicEventsService {
  private readonly logger = new Logger(PublicEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchPublicEvents(
    options: SearchEventsOptions
  ): Promise<PublicEventSearchResult> {
    const {
      state,
      eventType,
      startDate,
      endDate,
      limit = 24,
      offset = 0
    } = options;

    // Build where clause dynamically
    const where: {
      isPublished: boolean;
      isCancelled: boolean;
      isGuestOnly: boolean;
      startDate?: { gte?: Date; lte?: Date };
      eventType?: EventType;
      campground?: { state: string };
    } = {
      isPublished: true,
      isCancelled: false,
      isGuestOnly: false, // Only show public events
      // Only upcoming events by default
      startDate: {
        gte: startDate || new Date()
      }
    };

    // Filter by event type
    if (eventType) {
      where.eventType = eventType;
    }

    // Filter by end date if provided
    if (endDate) {
      where.startDate = {
        ...where.startDate,
        lte: endDate
      };
    }

    // Filter by campground state
    if (state) {
      where.campground = {
        state: state.toUpperCase()
      };
    }

    // Get total count for pagination
    const total = await this.prisma.event.count({ where });

    // Fetch events with campground data
    const events = await this.prisma.event.findMany({
      where,
      include: {
        campground: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            state: true,
            heroImageUrl: true
          }
        }
      },
      orderBy: { startDate: "asc" },
      take: limit,
      skip: offset
    });

    // Transform to response format
    const results: PublicEventResult[] = events.map((event: typeof events[number]) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || null,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      imageUrl: event.imageUrl,
      priceCents: event.priceCents,
      capacity: event.capacity,
      currentSignups: event.currentSignups,
      location: event.location,
      campground: {
        id: event.campground.id,
        slug: event.campground.slug,
        name: event.campground.name,
        city: event.campground.city,
        state: event.campground.state,
        heroImageUrl: event.campground.heroImageUrl
      }
    }));

    return { results, total };
  }

  async getEventTypes(): Promise<EventType[]> {
    return Object.values(EventType);
  }

  async getUpcomingByState(
    state: string,
    limit: number = 6
  ): Promise<PublicEventResult[]> {
    const { results } = await this.searchPublicEvents({
      state,
      limit
    });
    return results;
  }
}
