"use client";

import React, { useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import {
  Loader2,
  CreditCard,
  Check,
  AlertCircle,
} from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { apiClient } from "../../../../lib/api-client";
import { cn } from "../../../../lib/utils";

interface ExternalPOSMethodProps {
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

type POSProvider = "square" | "clover" | "other";

const POS_PROVIDERS: { id: POSProvider; name: string; icon: string }[] = [
  { id: "square", name: "Square", icon: "⬛" },
  { id: "clover", name: "Clover", icon: "🍀" },
  { id: "other", name: "Other", icon: "💳" },
];

export default function ExternalPOSMethod({
  onSuccess,
  onError,
  onCancel,
}: ExternalPOSMethodProps) {
  const { state, actions, props } = usePaymentContext();
  const { remainingCents } = state;

  const [provider, setProvider] = useState<POSProvider | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [amountStr, setAmountStr] = useState((remainingCents / 100).toFixed(2));
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider) {
      onError("Please select a POS provider");
      return;
    }

    if (!transactionId.trim()) {
      onError("Please enter the transaction ID");
      return;
    }

    const amountCents = Math.round(parseFloat(amountStr) * 100);
    if (amountCents <= 0) {
      onError("Please enter a valid amount");
      return;
    }

    if (!confirmed) {
      onError("Please confirm the payment was received");
      return;
    }

    setProcessing(true);

    try {
      const result = await apiClient.recordExternalPayment(props.campgroundId, {
        amountCents,
        provider,
        externalTransactionId: transactionId.trim(),
        notes: notes.trim() || undefined,
        reservationId:
          props.subject.type === "reservation" || props.subject.type === "balance"
            ? props.subject.reservationId
            : undefined,
        recordedBy: "staff", // Could be enhanced to get actual staff ID
      });

      // Record the tender entry
      actions.addTenderEntry({
        method: "external_pos",
        amountCents,
        reference: result.paymentId,
        details: {
          provider,
          externalTransactionId: transactionId.trim(),
          notes: notes.trim(),
        },
      });

      onSuccess(result.paymentId);
    } catch (err: any) {
      onError(err.message || "Failed to record external payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* POS Provider Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">
          POS Provider
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {POS_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={cn(
                "p-3 border rounded-lg text-center transition-colors",
                provider === p.id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="text-2xl block mb-1">{p.icon}</span>
              <span className="text-sm font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Details */}
      {provider && (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-id">
                {provider === "square"
                  ? "Square Transaction ID"
                  : provider === "clover"
                  ? "Clover Transaction ID"
                  : "Transaction ID / Reference"}
              </Label>
              <Input
                id="transaction-id"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder={
                  provider === "square"
                    ? "e.g., abcd1234..."
                    : provider === "clover"
                    ? "e.g., ABCDEFGH..."
                    : "Enter transaction reference"
                }
                className="font-mono"
              />
              <p className="text-xs text-slate-500">
                Enter the transaction ID from your{" "}
                {provider === "other" ? "POS system" : provider} receipt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-amount">Amount Received</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <Input
                  id="external-amount"
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this transaction..."
                rows={2}
              />
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <p className="font-medium text-amber-800">
                  Confirm payment received
                </p>
                <p className="text-sm text-amber-600">
                  I confirm that the payment of ${amountStr} was successfully
                  processed on the {POS_PROVIDERS.find((p) => p.id === provider)?.name}{" "}
                  terminal and the funds have been received.
                </p>
              </div>
            </label>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              External payments are recorded for tracking purposes only. Ensure
              the payment was actually completed on your POS terminal before
              recording it here.
            </span>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            processing ||
            !provider ||
            !transactionId.trim() ||
            !confirmed ||
            parseFloat(amountStr) <= 0
          }
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Recording...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Record Payment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
