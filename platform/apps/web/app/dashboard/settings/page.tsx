"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DollarSign,
  Mail,
  Lock,
  Settings,
  Search,
  ChevronRight,
} from "lucide-react";

type SettingLink = {
  name: string;
  href: string;
  description: string;
};

type SettingCategory = {
  title: string;
  description: string;
  icon: typeof DollarSign;
  color: string;
  links: SettingLink[];
};

const settingsCategories: SettingCategory[] = [
  {
    title: "Pricing & Revenue",
    description: "Manage pricing strategies, rates, and revenue optimization",
    icon: DollarSign,
    color: "emerald",
    links: [
      {
        name: "Dynamic Pricing",
        href: "/dashboard/settings/pricing-rules",
        description: "Configure automated pricing rules based on demand, seasons, and events",
      },
      {
        name: "Seasonal Rates",
        href: "/dashboard/settings/seasonal-rates",
        description: "Set up seasonal rate variations throughout the year",
      },
      {
        name: "Deposit Policies",
        href: "/dashboard/settings/deposit-policies",
        description: "Define deposit requirements and policies for reservations",
      },
      {
        name: "Tax Rules",
        href: "/dashboard/settings/tax-rules",
        description: "Configure tax rates and rules for different site types",
      },
      {
        name: "Upsells",
        href: "/dashboard/settings/upsells",
        description: "Create and manage additional products and services",
      },
      {
        name: "Memberships",
        href: "/dashboard/settings/memberships",
        description: "Set up membership tiers and benefits",
      },
      {
        name: "Blackout Dates",
        href: "/dashboard/settings/blackout-dates",
        description: "Block dates for maintenance or special events",
      },
      {
        name: "Promotions",
        href: "/dashboard/settings/promotions",
        description: "Create promotional campaigns and discount codes",
      },
    ],
  },
  {
    title: "Communications",
    description: "Configure email templates and notification settings",
    icon: Mail,
    color: "blue",
    links: [
      {
        name: "Email Templates",
        href: "/dashboard/settings/templates",
        description: "Customize email templates for confirmations, reminders, and more",
      },
      {
        name: "Notification Triggers",
        href: "/dashboard/settings/notification-triggers",
        description: "Set up automated notifications and triggers",
      },
      {
        name: "Communications",
        href: "/dashboard/settings/communications",
        description: "Manage communication preferences and settings",
      },
      {
        name: "Campaigns",
        href: "/dashboard/settings/campaigns",
        description: "Create and manage marketing campaigns",
      },
    ],
  },
  {
    title: "Access & Security",
    description: "Manage users, permissions, and security settings",
    icon: Lock,
    color: "red",
    links: [
      {
        name: "Users & Roles",
        href: "/dashboard/settings/users",
        description: "Manage staff users and their roles",
      },
      {
        name: "Permissions",
        href: "/dashboard/settings/permissions",
        description: "Configure role-based access control",
      },
      {
        name: "Access Control",
        href: "/dashboard/settings/access-control",
        description: "Set up advanced access controls and restrictions",
      },
      {
        name: "Security",
        href: "/dashboard/settings/security",
        description: "Configure security policies and authentication",
      },
      {
        name: "Privacy",
        href: "/dashboard/settings/privacy",
        description: "Manage privacy settings and data protection",
      },
      {
        name: "Developers",
        href: "/dashboard/settings/developers",
        description: "API keys and developer tools",
      },
      {
        name: "Webhooks",
        href: "/dashboard/settings/webhooks",
        description: "Configure webhook endpoints for integrations",
      },
    ],
  },
  {
    title: "Property",
    description: "Configure campground details, branding, and localization",
    icon: Settings,
    color: "violet",
    links: [
      {
        name: "Campground Config",
        href: "/dashboard/settings/policies",
        description: "Basic campground information and policies",
      },
      {
        name: "Branding",
        href: "/dashboard/settings/branding",
        description: "Customize your brand colors, logo, and style",
      },
      {
        name: "Photos",
        href: "/dashboard/settings/photos",
        description: "Manage property photos and gallery",
      },
      {
        name: "Localization",
        href: "/dashboard/settings/localization",
        description: "Set timezone, language, and regional preferences",
      },
      {
        name: "Store Hours",
        href: "/dashboard/settings/store-hours",
        description: "Configure operating hours and schedules",
      },
      {
        name: "Integrations",
        href: "/dashboard/settings/integrations",
        description: "Connect third-party services and tools",
      },
      {
        name: "Analytics",
        href: "/dashboard/settings/analytics",
        description: "Configure analytics and tracking",
      },
      {
        name: "Payments",
        href: "/dashboard/settings/payments",
        description: "Set up payment processors and methods",
      },
      {
        name: "OTA Channels",
        href: "/dashboard/settings/ota",
        description: "Manage online travel agency integrations",
      },
      {
        name: "Gamification",
        href: "/dashboard/settings/gamification",
        description: "Configure badges, rewards, and engagement features",
      },
      {
        name: "Jobs",
        href: "/dashboard/settings/jobs",
        description: "Manage background jobs and scheduled tasks",
      },
    ],
  },
];

const iconColorMap: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700",
};

export default function SettingsLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories and links based on search query
  const filteredCategories = settingsCategories
    .map((category) => ({
      ...category,
      links: category.links.filter(
        (link) =>
          link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.links.length > 0 || searchQuery === "");

  return (
    <DashboardShell>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-2">
            Manage your campground configuration, pricing, communications, and security
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Settings Categories */}
        <div className="space-y-12">
          {filteredCategories.map((category) => {
            const IconComponent = category.icon;
            const iconColorClass = iconColorMap[category.color] || iconColorMap.violet;

            return (
              <div key={category.title}>
                {/* Category Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${iconColorClass}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{category.description}</p>
                  </div>
                </div>

                {/* Settings Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.links.map((link) => (
                    <Link key={link.href} href={link.href} className="block group">
                      <Card className="h-full transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer group-hover:bg-slate-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-900">
                              {link.name}
                            </CardTitle>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {link.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No settings found</h3>
            <p className="text-slate-500">
              Try adjusting your search term or browse the categories above
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
