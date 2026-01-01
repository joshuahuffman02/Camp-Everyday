"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Clock,
  Star,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SiteClass {
  id: string;
  name: string;
  siteType?: string | null;
  defaultRate?: number | null;
  maxOccupancy?: number | null;
}

interface BookingSidebarProps {
  campgroundName: string;
  campgroundSlug: string;
  siteClasses: SiteClass[];
  reviewScore?: number | null;
  reviewCount?: number | null;
  arrivalDate: string;
  departureDate: string;
  guests: string;
  onArrivalChange: (date: string) => void;
  onDepartureChange: (date: string) => void;
  onGuestsChange: (guests: string) => void;
  onBookClick: () => void;
  previewToken?: string;
  charityName?: string;
  className?: string;
}

export function BookingSidebar({
  campgroundName,
  campgroundSlug,
  siteClasses,
  reviewScore,
  reviewCount,
  arrivalDate,
  departureDate,
  guests,
  onArrivalChange,
  onDepartureChange,
  onGuestsChange,
  onBookClick,
  previewToken,
  charityName,
  className,
}: BookingSidebarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [selectedSiteType, setSelectedSiteType] = useState("all");

  // Calculate nights
  const nights = useMemo(() => {
    if (!arrivalDate || !departureDate) return 0;
    const start = new Date(arrivalDate);
    const end = new Date(departureDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [arrivalDate, departureDate]);

  // Get lowest price
  const lowestPrice = useMemo(() => {
    const prices = siteClasses
      .filter((sc) => sc.defaultRate && sc.defaultRate > 0)
      .map((sc) => sc.defaultRate!);
    return prices.length > 0 ? Math.min(...prices) / 100 : null;
  }, [siteClasses]);

  // Estimate total
  const estimatedTotal = useMemo(() => {
    if (!lowestPrice || !nights) return null;
    return lowestPrice * nights;
  }, [lowestPrice, nights]);

  // Get unique site types
  const siteTypes = useMemo(() => {
    const types = new Set<string>();
    siteClasses.forEach((sc) => {
      if (sc.siteType) types.add(sc.siteType.toLowerCase());
    });
    return Array.from(types);
  }, [siteClasses]);

  // Check if high demand (stubbed - would come from API)
  const isHighDemand = nights > 0 && (reviewCount || 0) > 10;

  return (
    <motion.div
      className={cn(
        "bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden",
        className
      )}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with price */}
      <div className="p-6 pb-4">
        <div className="flex items-baseline justify-between mb-1">
          {lowestPrice ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">
                ${lowestPrice.toFixed(0)}
              </span>
              <span className="text-slate-500">/ night</span>
            </div>
          ) : (
            <span className="text-lg font-medium text-slate-600">
              Check availability
            </span>
          )}

          {reviewScore && reviewCount && reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{Number(reviewScore).toFixed(1)}</span>
              <span className="text-slate-500">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* High demand badge */}
        {isHighDemand && (
          <Badge
            variant="secondary"
            className="bg-rose-50 text-rose-700 border-rose-200 mt-2"
          >
            <Zap className="h-3 w-3 mr-1" />
            Popular choice
          </Badge>
        )}
      </div>

      {/* Booking form */}
      <div className="px-6 pb-4 space-y-4">
        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={arrivalDate}
                onChange={(e) => onArrivalChange(e.target.value)}
                className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                aria-label="Check-in date"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => onDepartureChange(e.target.value)}
                className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                aria-label="Check-out date"
              />
            </div>
          </div>
        </div>

        {/* Guests selector */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
            Guests
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
            <Select value={guests} onValueChange={onGuestsChange}>
              <SelectTrigger className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Select guests" />
              </SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g} guest{g === "1" ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Site type filter */}
        {siteTypes.length > 1 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Accommodation type
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
              <Select value={selectedSiteType} onValueChange={setSelectedSiteType}>
                <SelectTrigger className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {siteTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown (expandable) */}
      {estimatedTotal && nights > 0 && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
            className="flex items-center justify-between w-full text-sm text-slate-600 hover:text-slate-900 transition-colors"
            aria-expanded={showPriceBreakdown}
          >
            <span className="underline decoration-dashed underline-offset-4">
              ${lowestPrice?.toFixed(0)} x {nights} night{nights === 1 ? "" : "s"}
            </span>
            {showPriceBreakdown ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showPriceBreakdown && (
            <motion.div
              className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-sm"
              initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="flex justify-between text-slate-600">
                <span>
                  ${lowestPrice?.toFixed(0)} x {nights} nights
                </span>
                <span>${estimatedTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cleaning fee</span>
                <span>TBD</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service fee</span>
                <span>TBD</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                <span>Estimated total</span>
                <span>${estimatedTotal.toFixed(0)}+</span>
              </div>
              <p className="text-xs text-slate-500">
                Final price shown on next step
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Reserve button */}
      <div className="px-6 pb-4">
        <Button
          onClick={onBookClick}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
        >
          Reserve
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
          You won't be charged yet
        </p>
      </div>

      {/* Charity badge */}
      {charityName && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border border-rose-100">
            <Heart className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700">
              Part of your booking supports{" "}
              <span className="font-medium">{charityName}</span>
            </p>
          </div>
        </div>
      )}

      {/* Trust signals */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Secure booking</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Instant confirmation</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
