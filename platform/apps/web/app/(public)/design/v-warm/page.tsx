"use client";

import { HeroWarm } from "@/components/design/HeroWarm";
import { FeaturedCampground } from "@/components/design/FeaturedCampground";
import { TestimonialsSection } from "@/components/design/TestimonialsSection";
import { ValueStack } from "@/components/public/ValueStack";
import { CharityImpactSection } from "@/components/charity/CharityImpactSection";

/**
 * Design Variant: Warm & Inviting
 *
 * Feel: Welcoming, approachable, human
 * - Emphasize emotional connection and storytelling
 * - Larger, more expressive typography with personality
 * - Featured testimonials with photos prominently displayed
 * - Warm earthy tones, organic shapes
 * - "Family-friendly" and "Safe getaway" messaging
 */

export default function DesignWarmPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Variant Label */}
      <div className="fixed top-4 left-4 z-50 bg-amber-500/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
        Version B: Warm & Inviting
      </div>

      {/* Hero */}
      <HeroWarm />

      {/* Featured Campground Spotlight */}
      <FeaturedCampground variant="warm" />

      {/* Testimonials - Prominent placement */}
      <TestimonialsSection variant="warm" />

      {/* Value Stack */}
      <ValueStack />

      {/* Charity Section */}
      <CharityImpactSection />

      {/* Footer placeholder */}
      <footer className="bg-amber-50 border-t border-amber-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-amber-700/70">
          <p className="text-sm">Footer would go here - warm styled variant</p>
        </div>
      </footer>
    </main>
  );
}
