import { Injectable, Logger } from "@nestjs/common";

type ExternalReview = {
  rating?: number | null;
  count?: number | null;
  source: string;
  reviews?: any[];
};

@Injectable()
export class CampgroundReviewConnectors {
  private readonly logger = new Logger(CampgroundReviewConnectors.name);

  private async fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  async fetchGoogleReviews(placeId?: string): Promise<ExternalReview | null> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !placeId) return null;

    const fields = [
      "rating",
      "user_ratings_total",
      "reviews",
      "url"
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=${fields}&reviews_sort=newest&language=en&key=${apiKey}`;

    try {
      const res = await this.fetchWithTimeout(url);
      if (!res.ok) {
        this.logger.warn(`Google Places fetch failed status=${res.status}`);
        return { source: "google_places", rating: null, count: null, reviews: [] };
      }
      const json = await res.json();
      if (json?.status && json.status !== "OK") {
        this.logger.warn(`Google Places response status=${json.status}`);
      }
      const result = json?.result ?? {};
      const rating = result.rating ?? null;
      const count = result.user_ratings_total ?? null;
      const reviews = Array.isArray(result.reviews)
        ? result.reviews.slice(0, 10).map((r: any) => ({
            author: r.author_name,
            rating: r.rating,
            text: r.text,
            time: r.time,
            relativeTime: r.relative_time_description,
            profilePhotoUrl: r.profile_photo_url
          }))
        : [];
      return { source: "google_places", rating, count, reviews };
    } catch (err: any) {
      this.logger.error(`Google Places fetch error: ${err?.message || err}`);
      return { source: "google_places", rating: null, count: null, reviews: [] };
    }
  }

  async fetchRvLifeReviews(parkId?: string): Promise<ExternalReview | null> {
    if (!parkId) return null;
    // Placeholder: actual API call not implemented
    this.logger.warn(`RV Life connector stubbed; no fetch performed for parkId=${parkId}`);
    return { source: "rv_life", rating: null, count: null, reviews: [] };
  }

  async collectExternalReviews(opts: { googlePlaceId?: string; rvLifeId?: string }) {
    const results: ExternalReview[] = [];
    const google = await this.fetchGoogleReviews(opts.googlePlaceId);
    if (google) results.push(google);
    const rvLife = await this.fetchRvLifeReviews(opts.rvLifeId);
    if (rvLife) results.push(rvLife);
    return results;
  }
}

