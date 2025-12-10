"use client";

import { cn } from "../../lib/utils";

type Category = {
    id: string;
    name: string;
    sortOrder: number;
};

interface CategoryTabsProps {
    categories: Category[];
    selected: string;
    onSelect: (id: string) => void;
}

export function CategoryTabs({ categories, selected, onSelect }: CategoryTabsProps) {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
                type="button"
                title="Show every item (reset filters)"
                onClick={() => onSelect("all")}
                className={cn(
                    "px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    selected === "all"
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
            >
                All items
            </button>
            {sorted.map((cat) => (
                <button
                    type="button"
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={cn(
                        "px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        selected === cat.id
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
