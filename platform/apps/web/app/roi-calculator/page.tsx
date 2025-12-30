import { Metadata } from "next";
import { ROICalculatorClient } from "./client";

export const metadata: Metadata = {
  title: "ROI Calculator | Camp Everyday - Calculate Your Savings",
  description:
    "Calculate how much you could save by switching to Camp Everyday. Compare your current software costs to our transparent pricing.",
  keywords: [
    "campground software roi",
    "rv park software cost calculator",
    "campground software pricing comparison",
    "reservation system cost",
  ],
  openGraph: {
    title: "Calculate Your Campground Software Savings",
    description:
      "See exactly how much you could save with Camp Everyday's transparent pricing model.",
    type: "website",
  },
};

export default function ROICalculatorPage() {
  return <ROICalculatorClient />;
}
