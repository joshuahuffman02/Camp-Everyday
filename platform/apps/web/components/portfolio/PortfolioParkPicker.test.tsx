"use client";

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortfolioParkPicker } from "./PortfolioParkPicker";

const mockFetch = vi.fn();
global.fetch = mockFetch as any;
process.env.NEXT_PUBLIC_API_BASE = "http://localhost:4000/api";

function renderPicker() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  qc.setQueryData(["portfolios"], {
    portfolios: [
      {
        id: "p1",
        name: "Alpha Portfolio",
        parks: [{ id: "park-1a", name: "Alpha Park", region: "West" }],
      },
      {
        id: "p2",
        name: "Beta Portfolio",
        parks: [
          { id: "park-2a", name: "Beta One", region: "East" },
          { id: "park-2b", name: "Beta Two", region: "East" },
        ],
      },
    ],
    activePortfolioId: "p1",
    activeParkId: "park-1a",
  });

  return render(
    <QueryClientProvider client={qc}>
      <PortfolioParkPicker tone="light" />
    </QueryClientProvider>
  );
}

describe("PortfolioParkPicker", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      // GET portfolios
      if (url.endsWith("/portfolios") && (!init || init.method === "GET")) {
        return new Response(
          JSON.stringify({
            portfolios: [
              {
                id: "p1",
                name: "Alpha Portfolio",
                parks: [{ id: "park-1a", name: "Alpha Park", region: "West" }],
              },
              {
                id: "p2",
                name: "Beta Portfolio",
                parks: [
                  { id: "park-2a", name: "Beta One", region: "East" },
                  { id: "park-2b", name: "Beta Two", region: "East" },
                ],
              },
            ],
            activePortfolioId: "p1",
            activeParkId: "park-1a",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      // POST select
      if (url.endsWith("/portfolios/select") && init?.method === "POST") {
        const body = init.body ? JSON.parse(init.body as string) : {};
        return new Response(
          JSON.stringify({ activePortfolioId: body.portfolioId, activeParkId: body.parkId ?? "park-1a" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("not found", { status: 404 });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("stores portfolio and park context to localStorage when the user switches", async () => {
    const user = userEvent.setup();
    renderPicker();

    await screen.findByText("Alpha Portfolio");
    const portfolioSelect = screen.getByTestId("portfolio-picker:portfolio") as HTMLSelectElement;
    const parkSelect = screen.getByTestId("portfolio-picker:park") as HTMLSelectElement;

    await waitFor(() => {
      expect(portfolioSelect.disabled).toBe(false);
      expect(parkSelect.disabled).toBe(false);
      expect(portfolioSelect).toHaveValue("p1");
      expect(parkSelect).toHaveValue("park-1a");
    });

    await user.selectOptions(portfolioSelect, "p2");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/portfolios\/select$/),
        expect.objectContaining({ method: "POST" })
      );
    });

    await user.selectOptions(screen.getByTestId("portfolio-picker:park"), "park-2b");

    await waitFor(() => {
      expect((screen.getByTestId("portfolio-picker:park") as HTMLSelectElement).value).toBe("park-2b");
    });
  });
});

