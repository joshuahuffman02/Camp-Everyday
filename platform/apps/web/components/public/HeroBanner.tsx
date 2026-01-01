"use client";

import Image from "next/image";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { TrustBadgesDark } from "./TrustBadges";
import { SocialProofInline } from "./SocialProofStrip";
import { useTemporalContext } from "../../hooks/use-temporal-context";
import { getGreeting } from "../../lib/temporal/greetings";
import { SeasonalParticles } from "../effects/SeasonalParticles";

interface HeroBannerProps {
  onSearch: (query: string, filters: {
    location: string;
    dates: { checkIn: string; checkOut: string };
    guests: number;
  } | null) => void;
}

// Time-appropriate icon component
function TimeIcon({ timeOfDay }: { timeOfDay: string }) {
  const iconClass = "w-6 h-6 md:w-8 md:h-8 text-white/80";

  switch (timeOfDay) {
    case "morning":
      return <Sunrise className={iconClass} />;
    case "afternoon":
      return <Sun className={iconClass} />;
    case "evening":
      return <Sunset className={iconClass} />;
    case "night":
      return <Moon className={iconClass} />;
    default:
      return <Sun className={iconClass} />;
  }
}

export function HeroBanner({ onSearch }: HeroBannerProps) {
  const { timeOfDay, isReducedMotion } = useTemporalContext();
  const greeting = getGreeting(timeOfDay);

  // Dynamic gradient classes based on time of day
  const gradientClass = `${greeting.gradientFrom} ${greeting.gradientVia} ${greeting.gradientTo}`;

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient - changes with time of day */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} transition-colors duration-1000`} />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Seasonal particles - leaves, snow, petals, or fireflies */}
        {!isReducedMotion && <SeasonalParticles />}

        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

        {/* Floating clay decorations - hidden on mobile for performance */}
        <div className="hidden md:block">
          {/* Left side decorations */}
          <div className="absolute top-20 left-[5%] w-16 h-16 opacity-60 animate-float-slow">
            <Image src="/images/icons/hero/pine-tree.png" alt="" fill className="object-contain" sizes="64px" />
          </div>
          <div className="absolute top-40 left-[12%] w-12 h-12 opacity-50 animate-float-medium">
            <Image src="/images/icons/hero/tent.png" alt="" fill className="object-contain" sizes="48px" />
          </div>
          <div className="absolute bottom-32 left-[8%] w-14 h-14 opacity-55 animate-float-fast">
            <Image src="/images/icons/hero/campfire.png" alt="" fill className="object-contain" sizes="56px" />
          </div>

          {/* Right side decorations */}
          <div className="absolute top-16 right-[8%] w-14 h-14 opacity-70 animate-float-medium">
            <Image src="/images/icons/hero/sun.png" alt="" fill className="object-contain" sizes="56px" />
          </div>
          <div className="absolute top-48 right-[5%] w-16 h-16 opacity-50 animate-float-slow">
            <Image src="/images/icons/hero/mountain.png" alt="" fill className="object-contain" sizes="64px" />
          </div>
          <div className="absolute bottom-40 right-[10%] w-10 h-10 opacity-45 animate-float-fast">
            <Image src="/images/icons/hero/moon.png" alt="" fill className="object-contain" sizes="40px" />
          </div>
        </div>

        {/* Mountain silhouette */}
        <svg
          className="absolute bottom-0 left-0 right-0 text-white/5"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
        {/* Trust badges - subtle at top */}
        <div className="mb-8 md:mb-12">
          <TrustBadgesDark className="justify-center" />
        </div>

        {/* Main headline - changes with time of day */}
        <div className="text-center mb-10 md:mb-12">
          {/* Time indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <TimeIcon timeOfDay={timeOfDay} />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
            {greeting.headline.split(",")[0]}
            {greeting.headline.includes(",") && (
              <span className={`block bg-gradient-to-r ${greeting.accentFrom} ${greeting.accentTo} bg-clip-text text-transparent`}>
                {greeting.headline.split(",")[1]?.trim() || "Top-Rated Campgrounds"}
              </span>
            )}
            {!greeting.headline.includes(",") && (
              <span className={`block bg-gradient-to-r ${greeting.accentFrom} ${greeting.accentTo} bg-clip-text text-transparent`}>
                Find Your Perfect Campsite
              </span>
            )}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {greeting.subheadline}
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-4xl mx-auto">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Social proof stats */}
        <div className="mt-12 md:mt-16">
          <SocialProofInline />
        </div>
      </div>
    </section>
  );
}
