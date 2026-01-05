"use client";

import { HeroRefined } from "@/components/design/HeroRefined";
import { FeaturedCampground } from "@/components/design/FeaturedCampground";
import { TestimonialsSection } from "@/components/design/TestimonialsSection";
import { ValueStack } from "@/components/public/ValueStack";
import { CharityImpactSection } from "@/components/charity/CharityImpactSection";

/**
 * Design Variant: Refined Evolution
 *
 * Feel: Trustworthy, premium, calm
 * - Keep the calm, professional tone
 * - Elevate typography hierarchy and spacing
 * - Subtle enhancements to cards and hover states
 * - Softer, warmer color accents
 * - Enhanced trust signals (safety badges, verified reviews)
 */

export default function DesignRefinedPage() {
  return (
    <main className="min-h-screen">
      {/* Variant Label */}
      <div className="fixed top-4 left-4 z-50 bg-keepr-evergreen/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
        Version A: Refined Evolution
      </div>

      {/* Hero */}
      <HeroRefined />

      {/* Featured Campground Spotlight */}
      <FeaturedCampground variant="refined" />

      {/* Testimonials */}
      <TestimonialsSection variant="refined" />

      {/* Value Stack */}
      <ValueStack />

      {/* Charity Section */}
      <CharityImpactSection />

      {/* Footer placeholder */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p className="text-sm">Footer would go here - same as current</p>
        </div>
      </footer>
    </main>
  );
}
