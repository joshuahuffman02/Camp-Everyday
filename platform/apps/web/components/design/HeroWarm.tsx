"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Heart, Users, Star, Sparkles, TreePine, Tent, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroWarm - "Warm & Inviting" variant
 *
 * Design principles:
 * - Emotional connection and storytelling
 * - Expressive, friendly typography
 * - Warm earthy tones (ambers, oranges, warm whites)
 * - Family-friendly messaging
 * - Organic shapes, softer edges
 * - Testimonials/social proof prominently featured
 */

// Floating testimonial snippets
const floatingTestimonials = [
  { text: "Best family trip ever!", author: "Sarah M.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face" },
  { text: "Felt so safe and welcomed", author: "Jennifer R.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face" },
];

export function HeroWarm() {
  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" />

      {/* Decorative organic shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large soft blob */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-3xl" />

        {/* Floating icons */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] opacity-40"
        >
          <TreePine className="w-16 h-16 text-amber-600" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 right-[15%] opacity-30"
        >
          <Tent className="w-20 h-20 text-orange-500" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-[8%] opacity-40"
        >
          <Sun className="w-14 h-14 text-amber-500" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            {/* Friendly badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg shadow-amber-500/10 border border-amber-100">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span className="text-sm text-slate-700 font-medium">Loved by families everywhere</span>
              </div>
            </motion.div>

            {/* Main Headline - Warm, expressive */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-800 leading-[1.1] mb-6"
            >
              <span className="text-amber-600">Create</span> memories
              <span className="block">that last forever</span>
            </motion.h1>

            {/* Subheadline - Emotional */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-600 mb-8 max-w-lg leading-relaxed"
            >
              Find welcoming campgrounds where your family can unplug, reconnect,
              and make stories worth sharing.
            </motion.p>

            {/* Search Box - Soft, rounded */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl shadow-xl shadow-amber-500/10 p-3 border border-amber-100"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Location Input */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-amber-50/50 rounded-2xl">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <input
                    type="text"
                    placeholder="Where do you want to explore?"
                    className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {/* Search Button */}
                <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40">
                  <Search className="w-5 h-5" />
                  <span>Find your spot</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Stats - Friendly format */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap gap-8"
            >
              {[
                { value: "500+", label: "Welcoming campgrounds" },
                { value: "50K+", label: "Happy families" },
                { value: "4.8★", label: "Average rating" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Hero Image with Floating Testimonials */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Main Image */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-500/20">
              <Image
                src="https://images.unsplash.com/photo-1515408320194-59643816c5b2?w=1200&h=800&fit=crop"
                alt="Happy family camping"
                width={600}
                height={400}
                className="object-cover w-full"
                priority
              />

              {/* Warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
            </div>

            {/* Floating Testimonials */}
            {floatingTestimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.2 }}
                className={cn(
                  "absolute bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/10 border border-amber-100 max-w-[200px]",
                  i === 0 ? "-left-8 top-1/4" : "-right-4 bottom-1/4"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image src={testimonial.avatar} alt={testimonial.author} fill className="object-cover" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{testimonial.author}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">"{testimonial.text}"</p>
                <div className="flex gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* "Safe for families" badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg border border-amber-100 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-700">Family-friendly stays</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave shape for transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" className="w-full h-20 text-white">
          <path d="M0,64 C320,100 720,0 1440,64 L1440,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
