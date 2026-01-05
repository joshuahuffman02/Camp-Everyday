"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Sparkles, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroBold - "Bold but Grounded" variant
 *
 * Design principles:
 * - Dramatic, cinematic imagery
 * - Strong visual hierarchy
 * - Bold use of Clay accent color
 * - Asymmetric, grid-breaking layout
 * - Confident typography with tight tracking
 * - Premium, distinctive feel
 */

export function HeroBold() {
  return (
    <section className="relative min-h-screen bg-keepr-charcoal overflow-hidden">
      {/* Background Image - Full bleed */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=2000&h=1200&fit=crop"
          alt="Dramatic mountain landscape"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-keepr-charcoal via-keepr-charcoal/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-keepr-charcoal via-transparent to-keepr-charcoal/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-12 gap-12 w-full items-center">
          {/* Left: Main Content - Takes 7 columns */}
          <div className="lg:col-span-7">
            {/* Bold Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-keepr-clay/20 rounded-full border border-keepr-clay/30">
                <Sparkles className="w-4 h-4 text-keepr-clay" />
                <span className="text-sm text-keepr-clay font-bold uppercase tracking-widest">
                  500+ Verified Campgrounds
                </span>
              </div>
            </motion.div>

            {/* Main Headline - Maximum impact */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tighter leading-[0.9] mb-8"
            >
              Touch
              <span className="block text-keepr-clay">grass.</span>
            </motion.h1>

            {/* Bold Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/70 mb-12 max-w-xl leading-relaxed font-light"
            >
              Escape the noise. Find your spot.
              <span className="text-white font-normal"> Book directly with zero surprises.</span>
            </motion.p>

            {/* Search - Sleek, minimal */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                <MapPin className="w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Where to?"
                  className="w-full bg-transparent text-white placeholder:text-white/50 focus:outline-none text-lg"
                />
              </div>

              <button className="px-8 py-4 bg-keepr-clay hover:bg-keepr-clay/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-keepr-clay/30 hover:shadow-keepr-clay/50 group">
                <Search className="w-5 h-5" />
                <span>Search</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Stats Row - Bold numbers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-16 flex gap-12"
            >
              {[
                { value: "4.9", label: "avg rating", suffix: "★" },
                { value: "50K", label: "happy campers", suffix: "+" },
                { value: "98", label: "would book again", suffix: "%" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    {stat.value}
                    <span className="text-keepr-clay">{stat.suffix}</span>
                  </p>
                  <p className="text-sm text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Featured Cards Stack - Takes 5 columns */}
          <div className="lg:col-span-5 relative hidden lg:block">
            {/* Stacked Cards Effect */}
            <motion.div
              initial={{ opacity: 0, y: 60, rotateY: 15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
              style={{ perspective: "1000px" }}
            >
              {/* Background card */}
              <div className="absolute top-8 -left-4 right-4 bottom-8 bg-white/5 backdrop-blur rounded-2xl border border-white/10 transform rotate-3" />

              {/* Main featured card */}
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Card Image */}
                <div className="relative h-64">
                  <Image
                    src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=500&fit=crop"
                    alt="Featured campground"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1.5 bg-keepr-clay text-white text-xs font-bold rounded-full">
                      #1 Rated
                    </div>
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur text-white text-xs font-medium rounded-full">
                      Verified
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Ponderosa Pines Resort</h3>
                      <p className="text-white/60 text-sm">Flagstaff, Arizona</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold">4.9</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/50 text-xs">From</p>
                      <p className="text-2xl font-bold text-white">
                        $65<span className="text-sm font-normal text-white/50">/night</span>
                      </p>
                    </div>
                    <Link
                      href="/park/ponderosa-pines"
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-keepr-charcoal rounded-xl font-semibold hover:bg-white/90 transition-colors group"
                    >
                      View
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating accent element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-8 -left-8 w-32 h-32 bg-keepr-clay/20 rounded-full blur-2xl"
            />
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-keepr-clay to-transparent" />
    </section>
  );
}
