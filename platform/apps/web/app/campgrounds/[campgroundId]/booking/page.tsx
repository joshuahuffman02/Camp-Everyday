"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function CampgroundBookingRedirect() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campgroundId = params?.campgroundId as string | undefined;

  useEffect(() => {
    if (!campgroundId) {
      router.replace("/campgrounds");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("campreserv:selectedCampground", campgroundId);
    }

    const qs = searchParams.toString();
    router.replace(qs ? `/booking?${qs}` : "/booking");
  }, [campgroundId, router, searchParams]);

  return null;
}
