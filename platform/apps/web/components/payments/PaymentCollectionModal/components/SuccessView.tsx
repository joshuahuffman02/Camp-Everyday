"use client";

import React from "react";
import { Button } from "../../../ui/button";
import {
  Check,
  Receipt,
  Mail,
  Printer,
  Download,
  CreditCard,
  Banknote,
  Wallet,
  Gift,
  Home,
  Building,
  Smartphone,
  FileText,
  Lock,
} from "lucide-react";
import { usePaymentContext } from "../context/PaymentContext";
import { PaymentMethodType, PAYMENT_METHOD_INFO, TenderEntry } from "../context/types";
import { cn } from "../../../../lib/utils";

interface SuccessViewProps {
  onClose: () => void;
  onPrintReceipt?: () => void;
  onEmailReceipt?: () => void;
}

export function SuccessView({
  onClose,
  onPrintReceipt,
  onEmailReceipt,
}: SuccessViewProps) {
  const { state, props } = usePaymentContext();
  const {
    tenderEntries,
    appliedDiscounts,
    charityDonation,
    originalAmountCents,
    discountCents,
    totalDueCents,
  } = state;

  const completedEntries = tenderEntries.filter((e) => e.status === "completed");
  const totalPaid = completedEntries.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      {/* Success Icon */}
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="h-10 w-10 text-emerald-600" strokeWidth={3} />
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Payment Complete!</h2>
        <p className="mt-1 text-slate-600">
          Thank you for your payment
        </p>
      </div>

      {/* Payment Summary */}
      <div className="w-full max-w-sm space-y-4">
        {/* Payment Breakdown */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          {/* Original amount */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="text-slate-900">
              ${(originalAmountCents / 100).toFixed(2)}
            </span>
          </div>

          {/* Discounts */}
          {appliedDiscounts.length > 0 && (
            <>
              {appliedDiscounts.map((discount, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-emerald-600">
                    {discount.code || discount.description}
                  </span>
                  <span className="text-emerald-600">
                    -${(discount.discountCents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Charity donation */}
          {charityDonation.optedIn && charityDonation.amountCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-pink-600">
                Donation to {charityDonation.charityName || "charity"}
              </span>
              <span className="text-pink-600">
                +${(charityDonation.amountCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-200 pt-2">
            <div className="flex justify-between font-medium">
              <span className="text-slate-900">Total Paid</span>
              <span className="text-emerald-600 text-lg">
                ${(totalPaid / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Used */}
        {completedEntries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">
              Payment{completedEntries.length > 1 ? "s" : ""} received via:
            </h3>
            <div className="space-y-2">
              {completedEntries.map((entry) => (
                <PaymentMethodRow key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Actions */}
      <div className="w-full max-w-sm space-y-3">
        {/* Email receipt */}
        {onEmailReceipt && props.guestEmail && (
          <Button
            variant="outline"
            onClick={onEmailReceipt}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Receipt to {props.guestEmail}
          </Button>
        )}

        {/* Print receipt */}
        {onPrintReceipt && (
          <Button
            variant="outline"
            onClick={onPrintReceipt}
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        )}

        {/* Close button */}
        <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
          Done
        </Button>
      </div>

      {/* Transaction reference */}
      {completedEntries.length > 0 && completedEntries[0].reference && (
        <p className="text-xs text-slate-400 font-mono">
          Ref: {completedEntries[0].reference}
        </p>
      )}
    </div>
  );
}

interface PaymentMethodRowProps {
  entry: TenderEntry;
}

function PaymentMethodRow({ entry }: PaymentMethodRowProps) {
  const methodInfo = PAYMENT_METHOD_INFO[entry.method];
  const Icon = getMethodIcon(entry.method);

  return (
    <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="text-sm text-slate-700">{methodInfo.label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900">
        ${(entry.amountCents / 100).toFixed(2)}
      </span>
    </div>
  );
}

function getMethodIcon(method: PaymentMethodType) {
  switch (method) {
    case "card":
    case "saved_card":
    case "terminal":
      return CreditCard;
    case "apple_pay":
    case "google_pay":
    case "link":
      return Smartphone;
    case "cash":
      return Banknote;
    case "check":
      return FileText;
    case "guest_wallet":
      return Wallet;
    case "gift_card":
      return Gift;
    case "folio":
      return Home;
    case "ach":
      return Building;
    case "deposit_hold":
      return Lock;
    case "external_pos":
      return Receipt;
    default:
      return CreditCard;
  }
}

/**
 * Compact success indicator for inline confirmation
 */
export function SuccessIndicator({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-emerald-600">
      <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="h-3 w-3" />
      </div>
      <span className="text-sm font-medium">
        {message || "Payment successful"}
      </span>
    </div>
  );
}
