"use client";

import { useRef, useState, useEffect } from "react";
import {
  Caravan,
  Home,
  Tent,
  Sparkles,
  TreePine,
  Building2,
  Hexagon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export type CategoryType =
  | "all"
  | "rv"
  | "cabins"
  | "tents"
  | "glamping"
  | "lodges"
  | "unique";

interface Category {
  id: CategoryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  siteTypes: string[]; // Maps to SiteType enum values
}

const categories: Category[] = [
  {
    id: "all",
    label: "All",
    icon: Sparkles,
    siteTypes: []
  },
  {
    id: "rv",
    label: "RV Sites",
    icon: Caravan,
    siteTypes: ["rv"]
  },
  {
    id: "cabins",
    label: "Cabins",
    icon: Home,
    siteTypes: ["cabin"]
  },
  {
    id: "tents",
    label: "Tent Sites",
    icon: Tent,
    siteTypes: ["tent", "group"]
  },
  {
    id: "glamping",
    label: "Glamping",
    icon: Hexagon,
    siteTypes: ["glamping", "safari_tent", "dome"]
  },
  {
    id: "lodges",
    label: "Lodges",
    icon: Building2,
    siteTypes: ["hotel_room", "suite", "lodge_room"]
  },
  {
    id: "unique",
    label: "Unique Stays",
    icon: TreePine,
    siteTypes: ["yurt", "treehouse", "tiny_house", "airstream"]
  }
];

interface CategoryTabsProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  className?: string;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  className = ""
}: CategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if scroll arrows should be visible
  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateArrows();
    container.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    return () => {
      container.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <button
            onClick={() => scroll("left")}
            className="relative ml-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span className="text-xs font-medium whitespace-nowrap">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right scroll arrow */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          <button
            onClick={() => scroll("right")}
            className="relative mr-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      {/* Custom scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Export categories for use in filtering logic
export { categories };
export type { Category };
