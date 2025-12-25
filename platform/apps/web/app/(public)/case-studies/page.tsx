import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";
import CaseStudiesClient from "./CaseStudiesClient";

export const metadata: Metadata = getStaticPageMetadata("/case-studies");

export default function CaseStudiesPage() {
  return <CaseStudiesClient />;
}
