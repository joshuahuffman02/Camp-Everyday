"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * CampGuide has been merged into the AI Assistant page.
 * This page now redirects to /ai which provides all the AI capabilities
 * in a proper production-ready interface.
 */
export default function CampGuideRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ai");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Redirecting to AI Assistant...</p>
    </div>
  );
}
