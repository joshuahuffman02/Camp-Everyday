"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tent, ArrowRight, MapPin, Layers, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function SiteTypesPage() {
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteClassCount, setSiteClassCount] = useState(0);
  const [siteCount, setSiteCount] = useState(0);

  useEffect(() => {
    const id = localStorage.getItem("campreserv:selectedCampground");
    setCampgroundId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    Promise.all([
      apiClient.getSiteClasses(id).catch(() => []),
      apiClient.getSites(id).catch(() => [])
    ]).then(([classes, sites]) => {
      setSiteClassCount(Array.isArray(classes) ? classes.length : 0);
      setSiteCount(Array.isArray(sites) ? sites.length : 0);
      setLoading(false);
    });
  }, []);

  if (!campgroundId && !loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Site Types</h2>
          <p className="text-slate-500 mt-1">
            Manage your campground's site classes and individual sites
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-slate-600">Please select a campground first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Site Types</h2>
        <p className="text-slate-500 mt-1">
          Manage your campground's site classes and individual sites
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-emerald-100">
                  <Layers className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Site Classes</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure categories like Full Hookup, Partial Hookup, Tent Sites, and Cabins
                  </p>
                  <div className="flex gap-2 mt-3">
                    {loading ? (
                      <Badge variant="outline" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {siteClassCount} class{siteClassCount !== 1 ? "es" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/campgrounds/${campgroundId}/classes`}>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Individual Sites</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage specific sites, their features, and availability
                  </p>
                  <div className="flex gap-2 mt-3">
                    {loading ? (
                      <Badge variant="outline" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {siteCount} site{siteCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/campgrounds/${campgroundId}/sites`}>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Tent className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Site Map</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    View and manage your campground's interactive site map
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">Visual layout</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/campgrounds/${campgroundId}/map`}>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
