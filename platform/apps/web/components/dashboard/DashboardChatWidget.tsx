"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChatWidget } from "@/components/chat";

/**
 * Dashboard-specific chat widget wrapper that handles:
 * - Getting staff auth token from localStorage
 * - Getting selected campgroundId from localStorage
 * - Uses staff mode with blue accent color
 */
export function DashboardChatWidget() {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [campgroundId, setCampgroundId] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("campreserv:authToken");
    const storedCampground = localStorage.getItem("campreserv:selectedCampground");

    if (!storedToken || !storedCampground) {
      // Missing required data - don't show chat widget
      return;
    }

    setAuthToken(storedToken);
    setCampgroundId(storedCampground);

    // Get user ID from session
    if (session?.user?.id) {
      setUserId(session.user.id);
    }

    setIsReady(true);
  }, [session]);

  // Also watch for campground changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkCampground = () => {
      const currentCampground = localStorage.getItem("campreserv:selectedCampground");
      if (currentCampground !== campgroundId) {
        setCampgroundId(currentCampground || undefined);
      }
    };

    // Check periodically for campground changes
    const interval = setInterval(checkCampground, 1000);
    return () => clearInterval(interval);
  }, [campgroundId]);

  // Don't render until we have the minimum required data
  if (!isReady || !campgroundId || !authToken) {
    return null;
  }

  return (
    <ChatWidget
      campgroundId={campgroundId}
      isGuest={false}
      authToken={authToken}
      position="bottom-right"
      useStreaming={true}
      streamingTransport="sse"
    />
  );
}
