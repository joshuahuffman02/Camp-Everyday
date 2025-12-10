"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function CurrencyTaxPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const configQuery = useQuery({ queryKey: ["currency-tax"], queryFn: apiClient.getCurrencyTaxConfig });

  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [reportingCurrency, setReportingCurrency] = useState("USD");
  const [conversion, setConversion] = useState({ amount: 1000, from: "USD", to: "CAD" });

  useEffect(() => {
    if (configQuery.data) {
      setBaseCurrency(configQuery.data.baseCurrency);
      setReportingCurrency(configQuery.data.reportingCurrency);
      setConversion((prev) => ({ ...prev, from: configQuery.data.baseCurrency, to: configQuery.data.reportingCurrency }));
    }
  }, [configQuery.data]);

  const updateMutation = useMutation({
    mutationFn: apiClient.updateCurrencyTaxConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currency-tax"] });
      toast({ title: "Currency/tax config saved" });
    },
    onError: (err: any) => toast({ title: "Save failed", description: err?.message ?? "Try again", variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: apiClient.convertCurrency,
    onSuccess: (data) => {
      toast({ title: "Conversion", description: `${conversion.amount} ${conversion.from} → ${data.converted} ${conversion.to} @ ${data.rate}` });
    },
    onError: (err: any) => toast({ title: "Conversion failed", description: err?.message ?? "Try again", variant: "destructive" }),
  });

  const currencies = useMemo(() => {
    const fxCurrencies = configQuery.data?.fxRates.flatMap((r) => [r.base, r.quote]) ?? [];
    return Array.from(new Set([...(fxCurrencies ?? []), baseCurrency, reportingCurrency]));
  }, [configQuery.data?.fxRates, baseCurrency, reportingCurrency]);

  const saveConfig = () => {
    updateMutation.mutate({ baseCurrency, reportingCurrency });
  };

  const convert = () => {
    convertMutation.mutate({ amount: conversion.amount, from: conversion.from, to: conversion.to });
  };

  return (
    <DashboardShell>
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Currency & tax", href: "/settings/currency-tax" },
        ]}
      />

      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-slate-900">Currency & tax</h1>
        <p className="text-sm text-slate-600">FX stubs, VAT/GST profiles, and per-park currencies.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Base/reporting currency plus FX provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-700">Base currency</div>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">Reporting currency</div>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={reportingCurrency}
                  onChange={(e) => setReportingCurrency(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={saveConfig} disabled={updateMutation.isPending}>
              Save
            </Button>
            <div className="text-xs text-slate-500">Stub FX provider: {configQuery.data?.fxProvider ?? "stub"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick conversion (stub)</CardTitle>
            <CardDescription>Uses FX table below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={conversion.amount}
                onChange={(e) => setConversion((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-28"
              />
              <select
                className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                value={conversion.from}
                onChange={(e) => setConversion((prev) => ({ ...prev, from: e.target.value }))}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">→</span>
              <select
                className="rounded-md border border-slate-300 px-2 py-2 text-sm"
                value={conversion.to}
                onChange={(e) => setConversion((prev) => ({ ...prev, to: e.target.value }))}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={convert} variant="outline" size="sm" disabled={convertMutation.isPending}>
              Convert
            </Button>
            <div className="text-xs text-slate-500">No real FX integrations required; stubbed data only.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FX rates</CardTitle>
          <CardDescription>Rates are stubbed and safe for demos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>As of</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(configQuery.data?.fxRates ?? []).map((rate) => (
                  <TableRow key={`${rate.base}-${rate.quote}`}>
                    <TableCell className="font-semibold">
                      {rate.base} → {rate.quote}
                    </TableCell>
                    <TableCell>{rate.rate}</TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(rate.asOf).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax profiles</CardTitle>
          <CardDescription>VAT, GST/PST, and sales tax stubs per region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Inclusive</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(configQuery.data?.taxProfiles ?? []).map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-semibold">{profile.name}</TableCell>
                    <TableCell>{profile.region}</TableCell>
                    <TableCell className="uppercase">{profile.type}</TableCell>
                    <TableCell>{(profile.rate * 100).toFixed(1)}%</TableCell>
                    <TableCell>{profile.inclusive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-sm text-slate-500">{profile.notes ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Park currencies</CardTitle>
          <CardDescription>Mapping parks to currency/tax profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Park</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Tax profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(configQuery.data?.parkCurrencies ?? []).map((row) => (
                  <TableRow key={`${row.parkId}-${row.currency}`}>
                    <TableCell className="font-semibold">{row.parkId}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{row.taxProfileId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="text-xs text-slate-500">
        Minimal slice: FX stub provider, VAT/GST profiles, per-park currency mapping, and conversions to exercise the multi-currency/tax API.
      </div>
    </DashboardShell>
  );
}

