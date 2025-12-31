"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

const pillars = [
  {
    image: "/images/icons/trust-security.png",
    title: "Secure Booking",
    description: "Your payment and personal info protected with bank-level security.",
    guarantee: "100% secure",
  },
  {
    image: "/images/icons/easy-booking.png",
    title: "Easy Booking",
    description: "Book your perfect campsite in just a few clicks. Simple, fast, done.",
    guarantee: "Book in minutes",
  },
  {
    image: "/images/icons/support.png",
    title: "24/7 Support",
    description: "Real humans ready to help whenever you need us. Day or night.",
    guarantee: "Always here for you",
  },
  {
    image: "/images/icons/best-price.png",
    title: "Best Price",
    description: "Book direct with campgrounds. No middleman markup, no hidden fees.",
    guarantee: "Price match guarantee",
  },
  {
    image: "/images/icons/verified-reviews.png",
    title: "Verified Reviews",
    description: "Real reviews from real campers. Know what to expect before you arrive.",
    guarantee: "Trusted feedback",
  },
  {
    image: "/images/icons/instant-confirm.png",
    title: "Instant Confirmation",
    description: "Know you're booked in seconds. Real-time availability, no waiting.",
    guarantee: "Confirmed immediately",
  },
];

interface ValueStackProps {
  className?: string;
}

export function ValueStack({ className }: ValueStackProps) {
  return (
    <section className={cn("py-16 md:py-20 bg-slate-50", className)}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Why Book With Camp Everyday?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We partner directly with campgrounds to bring you the best experience.
            No middleman markup, no hidden fees, just great camping.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 transition-all hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="relative w-16 h-16 mb-6">
                <Image
                  src={pillar.image}
                  alt={pillar.title}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
              <p className="text-slate-600 mb-4">{pillar.description}</p>

              {/* Guarantee badge */}
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{pillar.guarantee}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Additional trust statement */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-emerald-50 text-emerald-700 rounded-full px-5 py-2.5 text-sm font-medium">
            <Image
              src="/images/icons/trust-security.png"
              alt="Security"
              width={24}
              height={24}
              className="object-contain"
            />
            Your satisfaction is our priority
          </div>
        </div>
      </div>
    </section>
  );
}
