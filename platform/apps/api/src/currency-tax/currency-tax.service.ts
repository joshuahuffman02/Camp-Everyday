import { Injectable } from "@nestjs/common";

type FxRate = {
  base: string;
  quote: string;
  rate: number;
  asOf: string;
};

type TaxProfile = {
  id: string;
  name: string;
  region: string;
  type: "vat" | "gst" | "sales";
  rate: number;
  inclusive: boolean;
  notes?: string;
};

type CurrencyTaxConfig = {
  baseCurrency: string;
  reportingCurrency: string;
  fxProvider: string;
  fxRates: FxRate[];
  taxProfiles: TaxProfile[];
  parkCurrencies: { parkId: string; currency: string; taxProfileId: string }[];
  updatedAt: string;
};

type ConversionResult = {
  amount: number;
  from: string;
  to: string;
  rate: number;
  converted: number;
  asOf: string;
};

@Injectable()
export class CurrencyTaxService {
  private config: CurrencyTaxConfig = {
    baseCurrency: "USD",
    reportingCurrency: "USD",
    fxProvider: "stub",
    fxRates: [
      { base: "USD", quote: "CAD", rate: 1.34, asOf: new Date().toISOString() },
      { base: "USD", quote: "EUR", rate: 0.92, asOf: new Date().toISOString() },
      { base: "CAD", quote: "EUR", rate: 0.69, asOf: new Date().toISOString() },
    ],
    taxProfiles: [
      { id: "us-default", name: "US sales/lodging", region: "US", type: "sales", rate: 0.085, inclusive: false },
      { id: "ca-gst-pst", name: "GST/PST (BC)", region: "CA-BC", type: "gst", rate: 0.12, inclusive: false, notes: "GST 5% + PST 7%" },
      { id: "eu-vat", name: "EU VAT (DE)", region: "DE", type: "vat", rate: 0.19, inclusive: true },
    ],
    parkCurrencies: [
      { parkId: "cg-redwood", currency: "USD", taxProfileId: "us-default" },
      { parkId: "cg-lakeview", currency: "CAD", taxProfileId: "ca-gst-pst" },
      { parkId: "cg-alpine", currency: "EUR", taxProfileId: "eu-vat" },
    ],
    updatedAt: new Date().toISOString(),
  };

  getConfig(): CurrencyTaxConfig {
    return this.config;
  }

  updateConfig(payload: Partial<CurrencyTaxConfig>): CurrencyTaxConfig {
    this.config = {
      ...this.config,
      ...payload,
      fxRates: payload.fxRates ?? this.config.fxRates,
      taxProfiles: payload.taxProfiles ?? this.config.taxProfiles,
      parkCurrencies: payload.parkCurrencies ?? this.config.parkCurrencies,
      updatedAt: new Date().toISOString(),
    };
    return this.config;
  }

  convert(amount: number, from: string, to: string): ConversionResult {
    if (from === to) {
      return { amount, from, to, rate: 1, converted: amount, asOf: new Date().toISOString() };
    }
    const direct = this.config.fxRates.find((r) => r.base === from && r.quote === to);
    if (direct) {
      return {
        amount,
        from,
        to,
        rate: direct.rate,
        converted: Number((amount * direct.rate).toFixed(2)),
        asOf: direct.asOf,
      };
    }
    const inverse = this.config.fxRates.find((r) => r.base === to && r.quote === from);
    if (inverse) {
      const rate = 1 / inverse.rate;
      return {
        amount,
        from,
        to,
        rate: Number(rate.toFixed(6)),
        converted: Number((amount * rate).toFixed(2)),
        asOf: inverse.asOf,
      };
    }
    const base = this.config.baseCurrency;
    const toBase: ConversionResult = this.convert(amount, from, base);
    const final: ConversionResult = this.convert(toBase.converted, base, to);
    return {
      amount,
      from,
      to,
      rate: Number((toBase.rate * final.rate).toFixed(6)),
      converted: final.converted,
      asOf: new Date().toISOString(),
    };
  }

  summary(): {
    exposureByCurrency: Record<string, number>;
    fxRates: FxRate[];
    taxProfiles: TaxProfile[];
    reportingCurrency: string;
    updatedAt: string;
  } {
    const exposureByCurrency = this.config.parkCurrencies.reduce<Record<string, number>>((acc, row) => {
      acc[row.currency] = (acc[row.currency] ?? 0) + 1;
      return acc;
    }, {});
    return {
      exposureByCurrency,
      fxRates: this.config.fxRates,
      taxProfiles: this.config.taxProfiles,
      reportingCurrency: this.config.reportingCurrency,
      updatedAt: this.config.updatedAt,
    };
  }
}

