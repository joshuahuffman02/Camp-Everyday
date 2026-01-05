"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Users, Shield, CheckCircle2, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroRefined - "Refined Evolution" variant
 *
 * Design principles:
 * - Calm, professional, premium feel
 * - Elevated typography with more hierarchy
 * - Subtle enhancements, no dramatic changes
 * - Enhanced trust signals
 * - Clean, spacious layout
 */

export function HeroRefined() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=2000&h=1200&fit=crop"
          alt="Peaceful campground at sunset"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Refined overlay - softer gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Shield className="w-4 h-4 text-keepr-evergreen" />
              <span className="text-sm text-white/90 font-medium">Trusted by 50,000+ happy campers</span>
              <div className="flex items-center gap-0.5 ml-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Headline - Elevated typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.95] mb-6"
          >
            Find your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-keepr-evergreen to-teal-400">
              perfect escape
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/80 mb-10 max-w-xl leading-relaxed"
          >
            Discover verified campgrounds with transparent pricing.
            Book directly, no surprises.
          </motion.p>

          {/* Search Box - Refined styling */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-2 max-w-2xl"
          >
            <div className="flex flex-col md:flex-row">
              {/* Location */}
              <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Where</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    className="w-full text-slate-800 placeholder:text-slate-400 focus:outline-none text-base"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="flex-1 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">When</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Add dates"
                    className="w-full text-slate-800 placeholder:text-slate-400 focus:outline-none text-base"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="flex-1 px-4 py-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Guests</label>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Add guests"
                    className="w-full text-slate-800 placeholder:text-slate-400 focus:outline-none text-base"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="p-2">
                <button className="w-full md:w-auto px-6 py-4 bg-keepr-evergreen hover:bg-keepr-evergreen/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-keepr-evergreen/30 hover:shadow-keepr-evergreen/40">
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Trust Signals Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-6"
          >
            {[
              { icon: CheckCircle2, text: "Verified reviews" },
              { icon: Shield, text: "Secure booking" },
              { icon: Star, text: "Best price guarantee" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70">
                <item.icon className="w-4 h-4 text-keepr-evergreen" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Floating Card - Featured Campground Preview */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl">
          <div className="relative w-64 h-40 rounded-xl overflow-hidden mb-3">
            <Image
              src="https://images.unsplash.com/photo-1533873984035-25970ab07461?w=600&h=400&fit=crop"
              alt="Featured campground"
              fill
              className="object-cover"
              sizes="256px"
            />
            <div className="absolute top-2 left-2 px-2 py-1 bg-keepr-evergreen text-white text-xs font-bold rounded-full">
              Top Rated
            </div>
          </div>
          <h3 className="text-white font-semibold mb-1">Ponderosa Pines Resort</h3>
          <p className="text-white/60 text-sm mb-2">Flagstaff, Arizona</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-white font-medium">4.9</span>
              <span className="text-white/50 text-sm">(847)</span>
            </div>
            <Link href="/park/ponderosa-pines" className="text-keepr-evergreen text-sm font-medium hover:underline">
              View →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Bottom gradient for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
