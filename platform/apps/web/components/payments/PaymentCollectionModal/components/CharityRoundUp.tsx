"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Checkbox } from "../../../ui/checkbox";
import { Label } from "../../../ui/label";
import { Heart } from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { cn } from "../../../../lib/utils";

interface CharityRoundUpProps {
  disabled?: boolean;
}

export function CharityRoundUp({ disabled = false }: CharityRoundUpProps) {
  const { state, actions, props } = usePaymentContext();
  const { charityDonation, originalAmountCents, discountCents } = state;

  // Calculate round-up amount
  const roundUpAmount = useMemo(() => {
    const currentTotal = originalAmountCents - discountCents;
    const dollars = currentTotal / 100;
    const roundedUp = Math.ceil(dollars);
    const roundUpCents = Math.round((roundedUp - dollars) * 100);

    // If already a round number, round up to next dollar
    return roundUpCents === 0 ? 100 : roundUpCents;
  }, [originalAmountCents, discountCents]);

  const handleToggle = (checked: boolean) => {
    actions.setCharityDonation({
      optedIn: checked,
      amountCents: roundUpAmount,
      charityId: charityDonation.charityId || "default-charity",
      charityName: charityDonation.charityName || "Local Community Fund",
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        charityDonation.optedIn
          ? "border-pink-300 bg-pink-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      )}
    >
      <Checkbox
        id="charity-roundup"
        checked={charityDonation.optedIn}
        onCheckedChange={handleToggle}
        disabled={disabled}
        className={cn(
          charityDonation.optedIn && "border-pink-500 data-[state=checked]:bg-pink-500"
        )}
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor="charity-roundup"
          className={cn(
            "text-sm cursor-pointer flex items-center gap-2",
            charityDonation.optedIn ? "text-pink-700" : "text-slate-700"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              charityDonation.optedIn ? "fill-pink-500 text-pink-500" : "text-slate-400"
            )}
          />
          Round up ${(roundUpAmount / 100).toFixed(2)} for{" "}
          {charityDonation.charityName || "charity"}
        </Label>
      </div>
    </div>
  );
}

/**
 * Inline charity round-up for compact display
 */
export function CharityRoundUpInline({ disabled = false }: CharityRoundUpProps) {
  const { state, actions } = usePaymentContext();
  const { charityDonation, originalAmountCents, discountCents } = state;

  const roundUpAmount = useMemo(() => {
    const currentTotal = originalAmountCents - discountCents;
    const dollars = currentTotal / 100;
    const roundedUp = Math.ceil(dollars);
    const roundUpCents = Math.round((roundedUp - dollars) * 100);
    return roundUpCents === 0 ? 100 : roundUpCents;
  }, [originalAmountCents, discountCents]);

  const handleToggle = () => {
    actions.setCharityDonation({
      optedIn: !charityDonation.optedIn,
      amountCents: roundUpAmount,
      charityId: charityDonation.charityId || "default-charity",
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors",
        charityDonation.optedIn
          ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          charityDonation.optedIn && "fill-pink-500"
        )}
      />
      <span>
        {charityDonation.optedIn ? "Donating" : "Add"} ${(roundUpAmount / 100).toFixed(2)}
      </span>
    </button>
  );
}
