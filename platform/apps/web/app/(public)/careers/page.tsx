import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";
import CareersClient from "./CareersClient";

export const metadata: Metadata = getStaticPageMetadata("/careers");

export default function CareersPage() {
  return <CareersClient />;
}
