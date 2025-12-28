"use client";

import React, { useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Loader2, FileText } from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";

interface CheckMethodProps {
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function CheckMethod({ onSuccess, onError, onCancel }: CheckMethodProps) {
  const { state, actions, props } = usePaymentContext();

  const [checkNumber, setCheckNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountDue = state.remainingCents / 100;
  const canComplete = checkNumber.trim().length > 0;

  const handleCancel = () => {
    actions.selectMethod(null);
    onCancel?.();
  };

  const handleComplete = async () => {
    if (!canComplete) {
      setError("Please enter a check number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate reference for check payment
      const reference = `CHECK-${checkNumber.trim()}`;

      // Add tender entry
      actions.addTenderEntry({
        method: "check",
        amountCents: state.remainingCents,
        reference,
        metadata: {
          checkNumber: checkNumber.trim(),
          bankName: bankName.trim() || undefined,
        },
      });

      onSuccess?.(reference);
    } catch (err: any) {
      setError(err.message || "Failed to record check payment");
      onError?.(err.message || "Failed to record check payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Amount display */}
      <div className="text-center p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-500">Check Amount</p>
        <p className="text-3xl font-bold text-slate-900">${amountDue.toFixed(2)}</p>
      </div>

      {/* Check details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="check-number" className="text-sm text-slate-600">
            Check Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="check-number"
            value={checkNumber}
            onChange={(e) => setCheckNumber(e.target.value)}
            placeholder="e.g., 1234"
            className="font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-name" className="text-sm text-slate-600">
            Bank Name <span className="text-slate-400">(optional)</span>
          </Label>
          <Input
            id="bank-name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g., First National Bank"
          />
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Ensure the check is properly endorsed and made out for the correct amount before
          recording this payment.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canComplete || loading}
          className="min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Record Check Payment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default CheckMethod;
