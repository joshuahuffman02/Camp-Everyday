import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useWhoami() {
  const isBrowser = typeof window !== "undefined";

  return useQuery({
    queryKey: ["permissions-whoami"],
    queryFn: () => apiClient.getWhoami(),
    enabled: isBrowser,
    staleTime: 5 * 60 * 1000,
    retry: false
  });
}

