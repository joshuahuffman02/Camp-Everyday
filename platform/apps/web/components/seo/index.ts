/**
 * SEO Components
 * Reusable components for structured data and SEO optimization
 */

export * from "./JsonLd";
export * from "./InternalLinks";

// Re-export Breadcrumbs from ui for backwards compatibility
export { Breadcrumbs, getCampgroundBreadcrumbs, getDashboardBreadcrumbs } from "../ui/breadcrumbs";
export type { BreadcrumbItem } from "../ui/breadcrumbs";
