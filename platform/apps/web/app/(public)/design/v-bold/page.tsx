"use client";

import { HeroBold } from "@/components/design/HeroBold";
import { FeaturedCampground } from "@/components/design/FeaturedCampground";
import { TestimonialsSection } from "@/components/design/TestimonialsSection";
import { CharityImpactSection } from "@/components/charity/CharityImpactSection";
import { Shield, CheckCircle2, Star } from "lucide-react";
import Image from "next/image";

/**
 * Design Variant: Bold but Grounded
 *
 * Feel: Confident, distinctive, premium
 * - More dramatic hero with cinematic imagery
 * - Asymmetric layouts that break the grid
 * - Bolder use of the Clay accent color
 * - Strong visual hierarchy with clear focal points
 * - Still professional but more memorable
 */

// Custom Value Stack for Bold variant - darker theme
function ValueStackBold() {
  const pillars = [
    {
      image: "/images/icons/trust-security.png",
      title: "Bank-Level Security",
      description: "Your data is encrypted and protected. Book with complete confidence.",
      guarantee: "100% Secure",
    },
    {
      image: "/images/icons/best-price.png",
      title: "Direct Booking",
      description: "No middlemen, no markup. Just honest prices from real campgrounds.",
      guarantee: "Best Price",
    },
    {
      image: "/images/icons/support.png",
      title: "24/7 Support",
      description: "Real humans ready to help. Day or night, rain or shine.",
      guarantee: "Always Available",
    },
  ];

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Why book with <span className="text-keepr-clay">Keepr</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need for a stress-free camping experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-keepr-clay/50 transition-all hover:-translate-y-1"
            >
              <div className="relative w-16 h-16 mb-6">
                <Image
                  src={pillar.image}
                  alt={pillar.title}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
              <p className="text-slate-400 mb-4">{pillar.description}</p>

              <div className="flex items-center gap-2 text-keepr-clay">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{pillar.guarantee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DesignBoldPage() {
  return (
    <main className="min-h-screen bg-keepr-charcoal">
      {/* Variant Label */}
      <div className="fixed top-4 left-4 z-50 bg-keepr-clay/90 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
        Version C: Bold but Grounded
      </div>

      {/* Hero */}
      <HeroBold />

      {/* Featured Campground Spotlight */}
      <FeaturedCampground variant="bold" />

      {/* Testimonials - Dark theme */}
      <TestimonialsSection variant="bold" />

      {/* Value Stack - Custom dark version */}
      <ValueStackBold />

      {/* Charity Section */}
      <CharityImpactSection />

      {/* Footer placeholder */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p className="text-sm">Footer would go here - dark styled variant</p>
        </div>
      </footer>
    </main>
  );
}
