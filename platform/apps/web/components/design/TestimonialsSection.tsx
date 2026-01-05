"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, CheckCircle2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder testimonials - female-friendly, trust-focused
const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "Denver, CO",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    campground: "Ponderosa Pines Resort",
    rating: 5,
    quote: "Our family felt so safe and welcomed. The kids are already asking when we can go back!",
    highlight: "safe and welcomed",
    stayDate: "October 2024",
  },
  {
    id: 2,
    name: "Jennifer Rodriguez",
    location: "Austin, TX",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    campground: "Hill Country Hideaway",
    rating: 5,
    quote: "Booking was so easy, and everything was exactly as described. No surprises, just pure relaxation.",
    highlight: "exactly as described",
    stayDate: "September 2024",
  },
  {
    id: 3,
    name: "Michelle Thompson",
    location: "Seattle, WA",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    campground: "Cascade Mountain Camp",
    rating: 5,
    quote: "As a solo female traveler, safety is my priority. This platform gave me peace of mind from start to finish.",
    highlight: "peace of mind",
    stayDate: "August 2024",
  },
  {
    id: 4,
    name: "Amanda Chen",
    location: "San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    campground: "Redwood Retreat",
    rating: 5,
    quote: "The reviews were spot-on and the campground exceeded expectations. Already planning our next trip!",
    highlight: "exceeded expectations",
    stayDate: "November 2024",
  },
];

interface TestimonialsSectionProps {
  variant?: "refined" | "warm" | "bold";
  className?: string;
}

export function TestimonialsSection({ variant = "refined", className }: TestimonialsSectionProps) {
  const variantStyles = {
    refined: {
      bg: "bg-slate-50",
      cardBg: "bg-white",
      accentColor: "text-keepr-evergreen",
      borderColor: "border-slate-200",
      quoteBg: "bg-keepr-evergreen/5",
    },
    warm: {
      bg: "bg-gradient-to-b from-amber-50/50 to-orange-50/30",
      cardBg: "bg-white",
      accentColor: "text-amber-600",
      borderColor: "border-amber-100",
      quoteBg: "bg-amber-50",
    },
    bold: {
      bg: "bg-keepr-charcoal",
      cardBg: "bg-slate-900",
      accentColor: "text-keepr-clay",
      borderColor: "border-slate-700",
      quoteBg: "bg-keepr-clay/10",
    },
  };

  const styles = variantStyles[variant];
  const isDark = variant === "bold";

  return (
    <section className={cn("py-20", styles.bg, className)}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4",
            variant === "warm" ? "bg-amber-100 text-amber-700" :
            variant === "bold" ? "bg-keepr-clay/20 text-keepr-clay" :
            "bg-keepr-evergreen/10 text-keepr-evergreen"
          )}>
            <Star className="w-4 h-4 fill-current" />
            <span>Trusted by thousands of happy campers</span>
          </div>

          <h2 className={cn(
            "text-3xl md:text-4xl lg:text-5xl font-bold mb-4",
            variant === "warm" ? "font-display tracking-tight" : "tracking-tight",
            isDark ? "text-white" : "text-slate-900"
          )}>
            {variant === "warm" ? "Real Stories from Happy Families" :
             variant === "bold" ? "Guests Love Us" :
             "What Our Guests Are Saying"}
          </h2>

          <p className={cn(
            "text-lg max-w-2xl mx-auto",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            {variant === "warm"
              ? "Join a community of adventurers who found their perfect getaway"
              : "Verified reviews from real guests who booked through Keepr"
            }
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "rounded-2xl p-6 border transition-all hover:shadow-lg",
                styles.cardBg,
                styles.borderColor,
                isDark ? "hover:border-slate-600" : "hover:border-slate-300"
              )}
            >
              {/* Quote Icon */}
              <div className={cn("mb-4 p-3 rounded-xl w-fit", styles.quoteBg)}>
                <Quote className={cn("w-5 h-5", styles.accentColor)} />
              </div>

              {/* Quote Text */}
              <p className={cn(
                "text-lg mb-6 leading-relaxed",
                isDark ? "text-slate-200" : "text-slate-700"
              )}>
                "{testimonial.quote.replace(
                  testimonial.highlight,
                  `**${testimonial.highlight}**`
                ).split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className={cn("font-semibold", styles.accentColor)}>
                      {part}
                    </span>
                  ) : part
                )}"
              </p>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4 fill-current",
                      variant === "warm" ? "text-amber-400" :
                      variant === "bold" ? "text-keepr-clay" :
                      "text-amber-400"
                    )}
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-white ring-slate-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className={cn(
                      "font-semibold",
                      isDark ? "text-white" : "text-slate-900"
                    )}>
                      {testimonial.name}
                    </p>
                    <p className={cn(
                      "text-sm",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {testimonial.location}
                    </p>
                  </div>
                </div>

                {/* Verified Badge */}
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  variant === "warm" ? "bg-green-50 text-green-600" :
                  variant === "bold" ? "bg-green-900/50 text-green-400" :
                  "bg-green-50 text-green-600"
                )}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Stay
                </div>
              </div>

              {/* Campground visited */}
              <div className={cn(
                "mt-4 pt-4 border-t text-sm",
                isDark ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500"
              )}>
                Stayed at <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                  {testimonial.campground}
                </span> - {testimonial.stayDate}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={cn(
            "mt-14 flex flex-wrap justify-center gap-8 md:gap-16 text-center",
            isDark ? "text-slate-400" : "text-slate-600"
          )}
        >
          <div>
            <p className={cn(
              "text-3xl font-bold mb-1",
              isDark ? "text-white" : "text-slate-900"
            )}>
              4.8
            </p>
            <p className="text-sm">Average Rating</p>
          </div>
          <div>
            <p className={cn(
              "text-3xl font-bold mb-1",
              isDark ? "text-white" : "text-slate-900"
            )}>
              50K+
            </p>
            <p className="text-sm">Happy Campers</p>
          </div>
          <div>
            <p className={cn(
              "text-3xl font-bold mb-1",
              isDark ? "text-white" : "text-slate-900"
            )}>
              98%
            </p>
            <p className="text-sm">Would Book Again</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
