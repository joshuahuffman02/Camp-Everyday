import { useState, useEffect } from "react";
import { Reservation, Quote } from "@campreserv/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Tag, Clock, Percent, Info } from "lucide-react";
import { PaymentCollectionModal } from "../payments/PaymentCollectionModal";
import { apiClient } from "@/lib/api-client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FinancialSummaryProps {
    reservation: Reservation;
}

export function FinancialSummary({ reservation }: FinancialSummaryProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(cents / 100);
    };

    const balanceCents = reservation.balanceAmount ?? 0;
    const totalCents = reservation.totalAmount ?? 0;
    const paidCents = reservation.paidAmount ?? 0;
    const baseCents = reservation.baseSubtotal ?? 0;
    const taxCents = reservation.taxesAmount ?? 0;
    const feesCents = reservation.feesAmount ?? 0;
    const discountsCents = reservation.discountsAmount ?? 0;
    const reservationExtended = reservation as Reservation & {
        feeMode?: string | null;
        metadata?: { feeMode?: string | null };
    };
    const feeMode = reservationExtended?.feeMode ?? reservationExtended?.metadata?.feeMode ?? null;
    const earlyCheckInCharge = reservation.earlyCheckInCharge ?? 0;
    const lateCheckoutCharge = reservation.lateCheckoutCharge ?? 0;

    const isPaid = balanceCents <= 0;

    const guest = reservation.guest;
    const guestId = guest?.id;
    const guestEmail = guest?.email;
    const guestName = guest
        ? `${guest.primaryFirstName || ''} ${guest.primaryLastName || ''}`.trim()
        : undefined;

    // Fetch quote data for pricing breakdown
    useEffect(() => {
        const fetchQuote = async () => {
            if (!reservation.campgroundId || !reservation.siteId) return;
            setQuoteLoading(true);
            try {
                const arrivalDate = typeof reservation.arrivalDate === 'string'
                    ? reservation.arrivalDate.split('T')[0]
                    : new Date(reservation.arrivalDate).toISOString().split('T')[0];
                const departureDate = typeof reservation.departureDate === 'string'
                    ? reservation.departureDate.split('T')[0]
                    : new Date(reservation.departureDate).toISOString().split('T')[0];
                const quoteData = await apiClient.getQuote(reservation.campgroundId, {
                    siteId: reservation.siteId,
                    arrivalDate,
                    departureDate
                });
                setQuote(quoteData);
            } catch (err) {
                console.error("Failed to fetch quote for breakdown:", err);
            } finally {
                setQuoteLoading(false);
            }
        };
        fetchQuote();
    }, [reservation.campgroundId, reservation.siteId, reservation.arrivalDate, reservation.departureDate]);

    // Calculate credit card processing fee estimate (standard 2.9% + $0.30)
    const estimatedCCFeePercent = 2.9;
    const estimatedCCFeeFlatCents = 30;
    const estimatedCCFeeCents = Math.round((totalCents * estimatedCCFeePercent / 100) + estimatedCCFeeFlatCents);

    // Get rule type icon
    const getRuleIcon = (type: string) => {
        switch (type) {
            case 'seasonal':
            case 'dow':
                return <Tag className="w-3 h-3" />;
            case 'demand':
                return <TrendingUp className="w-3 h-3" />;
            case 'length_of_stay':
                return <Clock className="w-3 h-3" />;
            default:
                return <Percent className="w-3 h-3" />;
        }
    };

    // Get rule type label
    const getRuleTypeLabel = (type: string) => {
        switch (type) {
            case 'seasonal': return 'Seasonal';
            case 'dow': return 'Day of Week';
            case 'demand': return 'Dynamic/Demand';
            case 'length_of_stay': return 'Length of Stay';
            case 'override': return 'Rate Override';
            default: return type;
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="w-5 h-5 text-slate-500" />
                        Financial Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Amount</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(totalCents)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Paid to Date</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(paidCents)}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-medium text-slate-900">Balance Due</span>
                            <span className={`text-lg font-bold ${isPaid ? "text-slate-400" : "text-red-600"}`}>
                                {formatCurrency(balanceCents)}
                            </span>
                        </div>
                        {!isPaid && (
                            <Button
                                className="w-full mt-2"
                                onClick={() => setIsPaymentModalOpen(true)}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pay Balance
                            </Button>
                        )}
                    </div>

                    {/* Detailed Pricing Breakdown */}
                    <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
                        <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                <span className="flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Pricing Breakdown
                                </span>
                                {isBreakdownOpen ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="space-y-3 pt-2 pb-3 border-t border-slate-100">
                                {/* Base Rate */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Base Lodging ({quote?.nights ?? '?'} nights)</span>
                                        <span className="text-slate-900">{formatCurrency(quote?.baseSubtotalCents ?? baseCents)}</span>
                                    </div>
                                    {quote?.perNightCents && (
                                        <div className="flex justify-between text-xs text-slate-400 pl-4">
                                            <span>Average per night</span>
                                            <span>{formatCurrency(quote.perNightCents)}/night</span>
                                        </div>
                                    )}
                                </div>

                                {/* Applied Pricing Rules */}
                                {quote?.appliedRules && quote.appliedRules.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                            Pricing Rules Applied
                                        </div>
                                        {quote.appliedRules.map((rule, idx) => (
                                            <div key={rule.id + idx} className="flex justify-between text-sm pl-2">
                                                <span className="flex items-center gap-2 text-slate-600">
                                                    {getRuleIcon(rule.type)}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help">{rule.name}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">{getRuleTypeLabel(rule.type)} pricing rule</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </span>
                                                <span className={rule.adjustmentCents >= 0 ? "text-amber-600" : "text-emerald-600"}>
                                                    {rule.adjustmentCents >= 0 ? '+' : ''}{formatCurrency(rule.adjustmentCents)}
                                                </span>
                                            </div>
                                        ))}
                                        {quote.rulesDeltaCents !== 0 && (
                                            <div className="flex justify-between text-xs text-slate-500 pl-4 pt-1 border-t border-slate-100">
                                                <span>Net pricing adjustment</span>
                                                <span className={quote.rulesDeltaCents >= 0 ? "text-amber-600" : "text-emerald-600"}>
                                                    {quote.rulesDeltaCents >= 0 ? '+' : ''}{formatCurrency(quote.rulesDeltaCents)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dynamic Pricing Indicator */}
                                {quote?.rulesDeltaCents !== undefined && quote.rulesDeltaCents !== 0 && !quote.appliedRules?.length && (
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-600">
                                            <TrendingUp className="w-3 h-3" />
                                            Dynamic Pricing Adjustment
                                        </span>
                                        <span className={quote.rulesDeltaCents >= 0 ? "text-amber-600" : "text-emerald-600"}>
                                            {quote.rulesDeltaCents >= 0 ? '+' : ''}{formatCurrency(quote.rulesDeltaCents)}
                                        </span>
                                    </div>
                                )}

                                {/* Early Check-in / Late Checkout */}
                                {earlyCheckInCharge > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-3 h-3" />
                                            Early Check-in Charge
                                        </span>
                                        <span className="text-slate-900">+{formatCurrency(earlyCheckInCharge)}</span>
                                    </div>
                                )}
                                {lateCheckoutCharge > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-3 h-3" />
                                            Late Checkout Charge
                                        </span>
                                        <span className="text-slate-900">+{formatCurrency(lateCheckoutCharge)}</span>
                                    </div>
                                )}

                                {/* Subtotal before fees */}
                                <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                                    <span className="text-slate-600">Subtotal (before fees/taxes)</span>
                                    <span className="text-slate-900">{formatCurrency(quote?.totalCents ?? baseCents)}</span>
                                </div>

                                {/* Booking/Service Fees */}
                                {feesCents > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Booking Fees</span>
                                            <span className="text-slate-900">+{formatCurrency(feesCents)}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 pl-4">
                                            {feeMode === "pass_through"
                                                ? "Guest paid service fees on this booking"
                                                : feeMode === "absorb"
                                                    ? "Service fees absorbed by property"
                                                    : "Service/processing fees"}
                                        </div>
                                    </div>
                                )}

                                {/* Taxes */}
                                {taxCents > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Taxes</span>
                                        <span className="text-slate-900">+{formatCurrency(taxCents)}</span>
                                    </div>
                                )}

                                {/* Discounts */}
                                {discountsCents > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="flex items-center gap-2 text-emerald-600">
                                                <Tag className="w-3 h-3" />
                                                Discounts Applied
                                            </span>
                                            <span className="text-emerald-600">-{formatCurrency(discountsCents)}</span>
                                        </div>
                                        {reservation.promoCode && (
                                            <div className="text-xs text-slate-400 pl-4">
                                                Promo code: {reservation.promoCode}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Credit Card Fee Info */}
                                <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Payment Processing
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>
                                            CC Fee ({estimatedCCFeePercent}% + ${(estimatedCCFeeFlatCents / 100).toFixed(2)})
                                        </span>
                                        <span className={feeMode === "absorb" ? "line-through text-slate-400" : ""}>
                                            ~{formatCurrency(estimatedCCFeeCents)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {feeMode === "pass_through"
                                            ? "Included in booking fees above"
                                            : feeMode === "absorb"
                                                ? "Absorbed by property (not charged to guest)"
                                                : "Standard credit card processing fee"}
                                    </div>
                                </div>

                                {/* Pricing Rule Version */}
                                {(quote?.pricingRuleVersion || reservation.pricingRuleVersion) && (
                                    <div className="text-xs text-slate-400 pt-2">
                                        Pricing version: {quote?.pricingRuleVersion || reservation.pricingRuleVersion}
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
            </Card>

            <PaymentCollectionModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                campgroundId={reservation.campgroundId}
                amountDueCents={balanceCents}
                subject={{ type: "balance", reservationId: reservation.id }}
                context="staff_checkin"
                guestId={guestId}
                guestEmail={guestEmail}
                guestName={guestName}
                enableSplitTender={true}
                enableCharityRoundUp={true}
                onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    window.location.reload();
                }}
            />
        </>
    );
}
