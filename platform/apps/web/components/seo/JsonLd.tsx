/**
 * JSON-LD Structured Data Components
 * Reusable components for injecting schema.org structured data
 */

import Script from "next/script";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateCampgroundSchema,
  generateArticleSchema,
  generateEventSchema,
  generateProductSchema,
  generateSoftwareSchema,
  generateHowToSchema,
} from "@/lib/seo/structured-data";

interface JsonLdProps {
  data: object;
  id?: string;
}

/**
 * Base JSON-LD component for custom schemas
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <Script
      id={id || "json-ld"}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization schema - use in root layout
 */
export function OrganizationJsonLd() {
  return <JsonLd data={generateOrganizationSchema()} id="organization-jsonld" />;
}

/**
 * Website schema with search action - use in root layout
 */
export function WebsiteJsonLd() {
  return <JsonLd data={generateWebsiteSchema()} id="website-jsonld" />;
}

/**
 * Software application schema - use on home/landing pages
 */
export function SoftwareJsonLd() {
  return <JsonLd data={generateSoftwareSchema()} id="software-jsonld" />;
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; path: string }>;
}

/**
 * Breadcrumb navigation schema
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return <JsonLd data={generateBreadcrumbSchema(items)} id="breadcrumb-jsonld" />;
}

interface FAQJsonLdProps {
  faqs: Array<{ question: string; answer: string }>;
}

/**
 * FAQ page schema
 */
export function FAQJsonLd({ faqs }: FAQJsonLdProps) {
  return <JsonLd data={generateFAQSchema(faqs)} id="faq-jsonld" />;
}

interface CampgroundJsonLdProps {
  campground: Parameters<typeof generateCampgroundSchema>[0];
}

/**
 * Campground/LodgingBusiness schema
 */
export function CampgroundJsonLd({ campground }: CampgroundJsonLdProps) {
  return <JsonLd data={generateCampgroundSchema(campground)} id="campground-jsonld" />;
}

interface ArticleJsonLdProps {
  article: Parameters<typeof generateArticleSchema>[0];
}

/**
 * Article/Blog post schema
 */
export function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  return <JsonLd data={generateArticleSchema(article)} id="article-jsonld" />;
}

interface EventJsonLdProps {
  event: Parameters<typeof generateEventSchema>[0];
}

/**
 * Event schema
 */
export function EventJsonLd({ event }: EventJsonLdProps) {
  return <JsonLd data={generateEventSchema(event)} id="event-jsonld" />;
}

interface ProductJsonLdProps {
  product: Parameters<typeof generateProductSchema>[0];
}

/**
 * Product schema for store items
 */
export function ProductJsonLd({ product }: ProductJsonLdProps) {
  return <JsonLd data={generateProductSchema(product)} id="product-jsonld" />;
}

interface HowToJsonLdProps {
  howTo: Parameters<typeof generateHowToSchema>[0];
}

/**
 * HowTo schema for tutorials
 */
export function HowToJsonLd({ howTo }: HowToJsonLdProps) {
  return <JsonLd data={generateHowToSchema(howTo)} id="howto-jsonld" />;
}

/**
 * Combined schema for root layout - includes Organization + Website
 */
export function RootJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
    </>
  );
}
