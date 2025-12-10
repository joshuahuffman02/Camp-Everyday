import { Injectable } from "@nestjs/common";

type LocaleOption = {
  code: string;
  label: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
};

type LocalizationSettings = {
  locale: string;
  currency: string;
  timezone: string;
  updatedAt: string;
  orgLocale?: string;
  orgCurrency?: string;
};

@Injectable()
export class LocalizationService {
  private readonly locales: LocaleOption[] = [
    {
      code: "en-US",
      label: "English (United States)",
      currency: "USD",
      timezone: "America/Denver",
      dateFormat: "MM/dd/yyyy",
      numberFormat: "1,234.56",
    },
    {
      code: "en-CA",
      label: "English (Canada)",
      currency: "CAD",
      timezone: "America/Toronto",
      dateFormat: "yyyy-MM-dd",
      numberFormat: "1 234,56",
    },
    {
      code: "es-ES",
      label: "Español (España)",
      currency: "EUR",
      timezone: "Europe/Madrid",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "1.234,56",
    },
    {
      code: "fr-CA",
      label: "Français (Canada)",
      currency: "CAD",
      timezone: "America/Montreal",
      dateFormat: "yyyy-MM-dd",
      numberFormat: "1 234,56",
    },
    {
      code: "de-DE",
      label: "Deutsch (Deutschland)",
      currency: "EUR",
      timezone: "Europe/Berlin",
      dateFormat: "dd.MM.yyyy",
      numberFormat: "1.234,56",
    },
  ];

  private readonly userSettings = new Map<string, LocalizationSettings>();

  listLocales() {
    return this.locales;
  }

  getSettings(userKey: string, orgKey?: string) {
    const key = this.makeKey(userKey, orgKey);
    const existing = this.userSettings.get(key);
    if (existing) return existing;
    const fallback = {
      locale: "en-US",
      currency: "USD",
      timezone: "America/Denver",
      updatedAt: new Date().toISOString(),
      orgLocale: orgKey ? "en-US" : undefined,
      orgCurrency: orgKey ? "USD" : undefined,
    };
    this.userSettings.set(key, fallback);
    return fallback;
  }

  updateSettings(userKey: string, orgKey: string | undefined, payload: Partial<LocalizationSettings>) {
    const key = this.makeKey(userKey, orgKey);
    const current = this.getSettings(userKey, orgKey);
    const next: LocalizationSettings = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.userSettings.set(key, next);
    return next;
  }

  preview(locale: string, currency: string, timezone: string) {
    const sampleDate = new Date("2025-01-15T15:30:00Z");
    const formattedDate = new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    }).format(sampleDate);

    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(98765.4321);

    const formattedCurrency = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(1234.56);

    return {
      sampleDate: sampleDate.toISOString(),
      formattedDate,
      formattedNumber,
      formattedCurrency,
      translatedPhrases: this.translationsFor(locale),
    };
  }

  private makeKey(userKey: string, orgKey?: string) {
    return `${orgKey ?? "org-default"}:${userKey}`;
  }

  private translationsFor(locale: string) {
    switch (locale) {
      case "es-ES":
        return {
          dashboard: "Panel",
          revenue: "Ingresos",
          occupancy: "Ocupación",
          approvals: "Aprobaciones",
        };
      case "fr-CA":
        return {
          dashboard: "Tableau de bord",
          revenue: "Revenu",
          occupancy: "Occupation",
          approvals: "Approbations",
        };
      case "de-DE":
        return {
          dashboard: "Übersicht",
          revenue: "Umsatz",
          occupancy: "Belegung",
          approvals: "Freigaben",
        };
      default:
        return {
          dashboard: "Dashboard",
          revenue: "Revenue",
          occupancy: "Occupancy",
          approvals: "Approvals",
        };
    }
  }
}

