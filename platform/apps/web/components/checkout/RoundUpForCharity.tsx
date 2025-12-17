"use client";

import { useState, useEffect } from "react";
import { Heart, Check, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface CharityConfig {
  id: string;
  campgroundId: string;
  charityId: string;
  isEnabled: boolean;
  customMessage: string | null;
  roundUpType: string;
  roundUpOptions: Record<string, unknown> | null;
  defaultOptIn: boolean;
  charity: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    category: string | null;
    isVerified: boolean;
  };
}

interface RoundUpCalculation {
  originalAmountCents: number;
  roundedAmountCents: number;
  donationAmountCents: number;
  charityName: string;
  charityId: string;
}

interface RoundUpForCharityProps {
  campgroundId: string;
  totalCents: number;
  onChange: (donation: { optedIn: boolean; amountCents: number; charityId: string | null }) => void;
}

export function RoundUpForCharity({ campgroundId, totalCents, onChange }: RoundUpForCharityProps) {
  const [charityConfig, setCharityConfig] = useState<CharityConfig | null>(null);
  const [roundUp, setRoundUp] = useState<RoundUpCalculation | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharityConfig = async () => {
      try {
        setLoading(true);
        const config = await apiClient.getCampgroundCharity(campgroundId);
        setCharityConfig(config);

        if (config?.isEnabled) {
          const calculation = await apiClient.calculateRoundUp(campgroundId, totalCents);
          setRoundUp(calculation);

          // Set default opt-in based on campground settings
          if (config.defaultOptIn && calculation.donationAmountCents > 0) {
            setOptedIn(true);
            onChange({
              optedIn: true,
              amountCents: calculation.donationAmountCents,
              charityId: calculation.charityId,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load charity config:", err);
        setError("Unable to load charity options");
      } finally {
        setLoading(false);
      }
    };

    if (campgroundId && totalCents > 0) {
      fetchCharityConfig();
    }
  }, [campgroundId, totalCents]);

  const handleToggle = () => {
    const newOptedIn = !optedIn;
    setOptedIn(newOptedIn);
    onChange({
      optedIn: newOptedIn,
      amountCents: newOptedIn && roundUp ? roundUp.donationAmountCents : 0,
      charityId: newOptedIn && roundUp ? roundUp.charityId : null,
    });
  };

  // Don't render if charity is not enabled or no round-up needed
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !charityConfig?.isEnabled || !roundUp || roundUp.donationAmountCents <= 0) {
    return null;
  }

  const donationAmount = (roundUp.donationAmountCents / 100).toFixed(2);
  const newTotal = ((totalCents + (optedIn ? roundUp.donationAmountCents : 0)) / 100).toFixed(2);

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all cursor-pointer ${
        optedIn
          ? "border-pink-500 bg-pink-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
      onClick={handleToggle}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            optedIn ? "bg-pink-500 text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Heart className={`h-5 w-5 ${optedIn ? "fill-current" : ""}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">Round up for charity</h4>
            {charityConfig.charity.isVerified && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3 mr-0.5" />
                Verified
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 mt-1">
            {charityConfig.customMessage || (
              <>
                Add <span className="font-semibold text-pink-600">${donationAmount}</span> to support{" "}
                <span className="font-medium">{charityConfig.charity.name}</span>
              </>
            )}
          </p>

          {charityConfig.charity.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {charityConfig.charity.description}
            </p>
          )}

          {optedIn && (
            <div className="mt-2 text-xs text-slate-500">
              New total: <span className="font-medium text-slate-700">${newTotal}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              optedIn
                ? "border-pink-500 bg-pink-500 text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {optedIn && <Check className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {charityConfig.charity.logoUrl && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-200">
          <img
            src={charityConfig.charity.logoUrl}
            alt={charityConfig.charity.name}
            className="h-6 w-auto object-contain"
          />
          <span className="text-xs text-slate-500">
            100% of your donation goes to {charityConfig.charity.name}
          </span>
        </div>
      )}
    </div>
  );
}

// Simplified inline version for tight spaces
export function RoundUpInline({ campgroundId, totalCents, onChange }: RoundUpForCharityProps) {
  const [charityConfig, setCharityConfig] = useState<CharityConfig | null>(null);
  const [roundUp, setRoundUp] = useState<RoundUpCalculation | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharityConfig = async () => {
      try {
        setLoading(true);
        const config = await apiClient.getCampgroundCharity(campgroundId);
        setCharityConfig(config);

        if (config?.isEnabled) {
          const calculation = await apiClient.calculateRoundUp(campgroundId, totalCents);
          setRoundUp(calculation);

          if (config.defaultOptIn && calculation.donationAmountCents > 0) {
            setOptedIn(true);
            onChange({
              optedIn: true,
              amountCents: calculation.donationAmountCents,
              charityId: calculation.charityId,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load charity config:", err);
      } finally {
        setLoading(false);
      }
    };

    if (campgroundId && totalCents > 0) {
      fetchCharityConfig();
    }
  }, [campgroundId, totalCents]);

  const handleToggle = () => {
    const newOptedIn = !optedIn;
    setOptedIn(newOptedIn);
    onChange({
      optedIn: newOptedIn,
      amountCents: newOptedIn && roundUp ? roundUp.donationAmountCents : 0,
      charityId: newOptedIn && roundUp ? roundUp.charityId : null,
    });
  };

  if (loading || !charityConfig?.isEnabled || !roundUp || roundUp.donationAmountCents <= 0) {
    return null;
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={optedIn}
        onChange={handleToggle}
        className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
      />
      <div className="flex items-center gap-2 text-sm">
        <Heart className={`h-4 w-4 ${optedIn ? "text-pink-500 fill-current" : "text-slate-400"}`} />
        <span className="text-slate-700">
          Round up <span className="font-medium text-pink-600">${(roundUp.donationAmountCents / 100).toFixed(2)}</span> for{" "}
          <span className="font-medium">{charityConfig.charity.name}</span>
        </span>
      </div>
    </label>
  );
}
