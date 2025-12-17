"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const dateRangeOptions = [
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_90_days", label: "Last 90 Days" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "ytd", label: "Year to Date" },
  { value: "all_time", label: "All Time" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-200">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {dateRangeOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-slate-200 focus:bg-slate-700 focus:text-white"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
