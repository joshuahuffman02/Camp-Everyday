"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiRedirectPage() {
  const router = useRouter();
  const [campgroundId, setCampgroundId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("campreserv:selectedCampground");
    setCampgroundId(stored);
    if (stored) {
      router.replace(`/campgrounds/${stored}/ai`);
    }
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Card className="max-w-lg border-slate-200">
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {campgroundId ? (
            <p>Redirecting to your campground AI settings...</p>
          ) : (
            <>
              <p>Select a campground to manage AI settings and the AI partner.</p>
              <Link
                href="/campgrounds?all=true"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Choose a campground
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
