"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Smartphone,
  Banknote,
  FileText,
  Home,
  Building,
  Wallet,
  Gift,
  Lock,
  Receipt,
  Apple,
  Loader2,
} from "lucide-react";

interface PaymentMethodsConfigProps {
  campgroundId: string;
}

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay";

interface PaymentMethodSettings {
  enableCardPayments: boolean;
  enableApplePay: boolean;
  enableGooglePay: boolean;
  enableACH: boolean;
  enableCash: boolean;
  enableCheck: boolean;
  enableFolio: boolean;
  enableGiftCards: boolean;
  enableExternalPOS: boolean;
  allowedCardBrands: CardBrand[];
  showFeeBreakdown: boolean;
}

const CARD_BRANDS: { id: CardBrand; name: string; icon: string }[] = [
  { id: "visa", name: "Visa", icon: "💳" },
  { id: "mastercard", name: "Mastercard", icon: "💳" },
  { id: "amex", name: "American Express", icon: "💳" },
  { id: "discover", name: "Discover", icon: "💳" },
  { id: "diners", name: "Diners Club", icon: "💳" },
  { id: "jcb", name: "JCB", icon: "💳" },
  { id: "unionpay", name: "UnionPay", icon: "💳" },
];

export function PaymentMethodsConfig({ campgroundId }: PaymentMethodsConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<PaymentMethodSettings>({
    enableCardPayments: true,
    enableApplePay: true,
    enableGooglePay: true,
    enableACH: true,
    enableCash: true,
    enableCheck: true,
    enableFolio: true,
    enableGiftCards: false,
    enableExternalPOS: false,
    allowedCardBrands: ["visa", "mastercard", "amex", "discover"],
    showFeeBreakdown: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payment-method-settings", campgroundId],
    queryFn: () => apiClient.getPaymentMethodSettings(campgroundId),
    enabled: !!campgroundId,
  });

  useEffect(() => {
    if (data) {
      setSettings({
        enableCardPayments: data.enableCardPayments ?? true,
        enableApplePay: data.enableApplePay ?? true,
        enableGooglePay: data.enableGooglePay ?? true,
        enableACH: data.enableACH ?? true,
        enableCash: data.enableCash ?? true,
        enableCheck: data.enableCheck ?? true,
        enableFolio: data.enableFolio ?? true,
        enableGiftCards: data.enableGiftCards ?? false,
        enableExternalPOS: data.enableExternalPOS ?? false,
        allowedCardBrands: data.allowedCardBrands ?? ["visa", "mastercard", "amex", "discover"],
        showFeeBreakdown: data.showFeeBreakdown ?? false,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: PaymentMethodSettings) =>
      apiClient.updatePaymentMethodSettings(campgroundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-method-settings", campgroundId] });
      toast({ title: "Saved", description: "Payment method settings updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleToggle = (key: keyof PaymentMethodSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCardBrandToggle = (brand: CardBrand) => {
    setSettings((prev) => {
      const brands = prev.allowedCardBrands.includes(brand)
        ? prev.allowedCardBrands.filter((b) => b !== brand)
        : [...prev.allowedCardBrands, brand];
      return { ...prev, allowedCardBrands: brands };
    });
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Card Payments
          </CardTitle>
          <CardDescription>
            Configure which card payment methods guests can use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable card payments */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Credit/Debit Cards</Label>
              <p className="text-sm text-slate-500">
                Accept card payments via Stripe
              </p>
            </div>
            <Switch
              checked={settings.enableCardPayments}
              onCheckedChange={(v) => handleToggle("enableCardPayments", v)}
            />
          </div>

          {/* Card Brands */}
          {settings.enableCardPayments && (
            <div className="space-y-3 pl-4 border-l-2 border-slate-100">
              <Label className="text-sm font-medium">Accepted Card Brands</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CARD_BRANDS.map((brand) => (
                  <label
                    key={brand.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      settings.allowedCardBrands.includes(brand.id)
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Checkbox
                      checked={settings.allowedCardBrands.includes(brand.id)}
                      onCheckedChange={() => handleCardBrandToggle(brand.id)}
                    />
                    <span className="text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Unselected brands will be rejected at checkout
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Digital Wallets
          </CardTitle>
          <CardDescription>
            Enable mobile wallet payment options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                <Apple className="h-5 w-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <Label>Apple Pay</Label>
                <p className="text-sm text-slate-500">
                  iOS and Safari users
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableApplePay}
              onCheckedChange={(v) => handleToggle("enableApplePay", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center">
                <span className="text-lg">G</span>
              </div>
              <div className="space-y-0.5">
                <Label>Google Pay</Label>
                <p className="text-sm text-slate-500">
                  Android and Chrome users
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableGooglePay}
              onCheckedChange={(v) => handleToggle("enableGooglePay", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Payments
          </CardTitle>
          <CardDescription>
            Enable bank transfer options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ACH Bank Transfer</Label>
              <p className="text-sm text-slate-500">
                US bank account payments (lower fees, slower settlement)
              </p>
            </div>
            <Switch
              checked={settings.enableACH}
              onCheckedChange={(v) => handleToggle("enableACH", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Manual Payments
          </CardTitle>
          <CardDescription>
            Cash, check, and other offline payment options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-emerald-600" />
              <div className="space-y-0.5">
                <Label>Cash</Label>
                <p className="text-sm text-slate-500">
                  Accept cash payments at check-in/POS
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableCash}
              onCheckedChange={(v) => handleToggle("enableCash", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="space-y-0.5">
                <Label>Check</Label>
                <p className="text-sm text-slate-500">
                  Accept check payments
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableCheck}
              onCheckedChange={(v) => handleToggle("enableCheck", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-amber-600" />
              <div className="space-y-0.5">
                <Label>Charge to Folio/Site</Label>
                <p className="text-sm text-slate-500">
                  Add charges to guest's site folio
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableFolio}
              onCheckedChange={(v) => handleToggle("enableFolio", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Special Payment Methods
          </CardTitle>
          <CardDescription>
            Gift cards, external terminals, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-pink-600" />
              <div className="space-y-0.5">
                <Label>Gift Cards</Label>
                <p className="text-sm text-slate-500">
                  Accept campground-issued gift cards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              <Switch
                checked={settings.enableGiftCards}
                onCheckedChange={(v) => handleToggle("enableGiftCards", v)}
                disabled
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-purple-600" />
              <div className="space-y-0.5">
                <Label>External POS (Square, Clover)</Label>
                <p className="text-sm text-slate-500">
                  Record payments from external terminals
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableExternalPOS}
              onCheckedChange={(v) => handleToggle("enableExternalPOS", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fee Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Display
          </CardTitle>
          <CardDescription>
            Control how fees are shown to guests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Fee Breakdown</Label>
              <p className="text-sm text-slate-500">
                Display processing fees as a separate line item (only applies in pass-through mode)
              </p>
            </div>
            <Switch
              checked={settings.showFeeBreakdown}
              onCheckedChange={(v) => handleToggle("showFeeBreakdown", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Payment Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
