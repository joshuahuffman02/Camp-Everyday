import { MetadataRoute } from "next";
import { apiClient } from "@/lib/api-client";

export const dynamic = "force-dynamic";

const baseUrl = (process.env.NEXT_PUBLIC_APP_BASE || "https://campeveryday.com").replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    try {
        const campgrounds = await apiClient.getPublicCampgrounds();

        const campgroundUrls = campgrounds.map((campground) => ({
            url: `${baseUrl}/park/${campground.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.8,
        }));

        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
            ...campgroundUrls,
        ];
    } catch (error) {
        console.error("Failed to generate sitemap:", error);
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
        ];
    }
}
