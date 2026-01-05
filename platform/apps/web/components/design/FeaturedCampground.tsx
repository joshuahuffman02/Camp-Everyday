"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Sparkles, ArrowRight, Shield, Users, Wifi, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

// Featured campground placeholder data
const featuredCampground = {
  id: "featured-1",
  name: "Ponderosa Pines Mountain Resort",
  slug: "ponderosa-pines",
  tagline: "Where memories are made under the stars",
  location: "Flagstaff, Arizona",
  rating: 4.9,
  reviewCount: 847,
  imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600&h=900&fit=crop",
  secondaryImage: "https://images.unsplash.com/photo-1533873984035-25970ab07461?w=800&h=600&fit=crop",
  features: ["Mountain Views", "Fire Pits", "Free WiFi", "Pet Friendly"],
  quote: "The best camping experience our family has ever had. We're already planning our return trip!",
  quoteAuthor: "The Martinez Family",
  priceFrom: 65,
  badge: "Guest Favorite 2024",
};

interface FeaturedCampgroundProps {
  variant?: "refined" | "warm" | "bold";
  className?: string;
}

export function FeaturedCampground({ variant = "refined", className }: FeaturedCampgroundProps) {
  const variantStyles = {
    refined: {
      bg: "bg-slate-50",
      cardBg: "bg-white",
      accentColor: "text-keepr-evergreen",
      accentBg: "bg-keepr-evergreen",
      badgeBg: "bg-keepr-evergreen/10 text-keepr-evergreen",
      buttonBg: "bg-keepr-evergreen hover:bg-keepr-evergreen/90",
    },
    warm: {
      bg: "bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30",
      cardBg: "bg-white",
      accentColor: "text-amber-600",
      accentBg: "bg-amber-500",
      badgeBg: "bg-amber-100 text-amber-700",
      buttonBg: "bg-amber-500 hover:bg-amber-600",
    },
    bold: {
      bg: "bg-keepr-charcoal",
      cardBg: "bg-slate-900",
      accentColor: "text-keepr-clay",
      accentBg: "bg-keepr-clay",
      badgeBg: "bg-keepr-clay/20 text-keepr-clay",
      buttonBg: "bg-keepr-clay hover:bg-keepr-clay/90",
    },
  };

  const styles = variantStyles[variant];
  const isDark = variant === "bold";

  return (
    <section className={cn("py-20 overflow-hidden", styles.bg, className)}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4",
            styles.badgeBg
          )}>
            <Sparkles className="w-4 h-4" />
            <span>Featured Destination</span>
          </div>

          <h2 className={cn(
            "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight",
            isDark ? "text-white" : "text-slate-900"
          )}>
            {variant === "warm" ? "This Week's Top Pick" :
             variant === "bold" ? "Editor's Choice" :
             "Spotlight Campground"}
          </h2>
        </motion.div>

        {/* Featured Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(
            "rounded-3xl overflow-hidden shadow-2xl",
            styles.cardBg,
            isDark ? "shadow-black/30" : "shadow-slate-200/50"
          )}
        >
          <div className="grid lg:grid-cols-2">
            {/* Image Section */}
            <div className="relative aspect-[4/3] lg:aspect-auto">
              <Image
                src={featuredCampground.imageUrl}
                alt={featuredCampground.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Badge */}
              <div className={cn(
                "absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg",
                styles.accentBg
              )}>
                {featuredCampground.badge}
              </div>

              {/* Rating on image */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-slate-900">{featuredCampground.rating}</span>
                <span className="text-slate-500 text-sm">({featuredCampground.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              {/* Location */}
              <div className={cn(
                "flex items-center gap-2 text-sm mb-3",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <MapPin className="w-4 h-4" />
                {featuredCampground.location}
              </div>

              {/* Name & Tagline */}
              <h3 className={cn(
                "text-2xl md:text-3xl font-bold mb-2",
                isDark ? "text-white" : "text-slate-900"
              )}>
                {featuredCampground.name}
              </h3>
              <p className={cn(
                "text-lg mb-6",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>
                {featuredCampground.tagline}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-3 mb-8">
                {featuredCampground.features.map((feature, i) => {
                  const icons = [Shield, Users, Wifi, Flame];
                  const Icon = icons[i % icons.length];
                  return (
                    <div
                      key={feature}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                        isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", styles.accentColor)} />
                      {feature}
                    </div>
                  );
                })}
              </div>

              {/* Quote */}
              <blockquote className={cn(
                "border-l-4 pl-4 mb-8",
                variant === "warm" ? "border-amber-400" :
                variant === "bold" ? "border-keepr-clay" :
                "border-keepr-evergreen"
              )}>
                <p className={cn(
                  "italic mb-2",
                  isDark ? "text-slate-300" : "text-slate-600"
                )}>
                  "{featuredCampground.quote}"
                </p>
                <cite className={cn(
                  "text-sm font-medium not-italic",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  - {featuredCampground.quoteAuthor}
                </cite>
              </blockquote>

              {/* Price & CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    Starting from
                  </p>
                  <p className={cn(
                    "text-3xl font-bold",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    ${featuredCampground.priceFrom}
                    <span className={cn(
                      "text-base font-normal ml-1",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      /night
                    </span>
                  </p>
                </div>

                <Link
                  href={`/park/${featuredCampground.slug}`}
                  className={cn(
                    "group flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl",
                    styles.buttonBg
                  )}
                >
                  Explore This Campground
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
