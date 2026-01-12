"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CampgroundHome() {
  const params = useParams();
  const router = useRouter();
  const campgroundParam = params?.campgroundId;
  const campgroundId = typeof campgroundParam === "string" ? campgroundParam : "";

  useEffect(() => {
    if (campgroundId) {
      router.replace(`/campgrounds/${campgroundId}/settings`);
    } else {
      router.replace("/campgrounds");
    }
  }, [campgroundId, router]);

  return null;
}
