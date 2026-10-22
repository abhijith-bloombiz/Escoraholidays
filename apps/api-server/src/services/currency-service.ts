import { logger } from "../lib/logger";

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED";
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["INR", "USD", "EUR", "GBP", "AED"];

// UAE Dirham is legally pegged to the US Dollar at exactly 1 USD = 3.6725 AED
export const AED_PER_USD_PEG = 3.6725;

export const FRANKFURTER_API_URL = "https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP";

export type ExchangeRateStatus = "live" | "cached" | "stale" | "fallback";

export interface ExchangeRatesSnapshot {
  base: "INR";
  referenceDate: string; // YYYY-MM-DD from ECB/Frankfurter
  lastUpdated: string;   // ISO timestamp of fetch/cache
  status: ExchangeRateStatus;
  provider: string;
  disclaimer: string;
  rates: Record<SupportedCurrency, number>; // target currency units per 1 INR
  inrPerUnit: Record<SupportedCurrency, number>; // INR per 1 target currency unit
}

export interface CanonicalBudgetTier {
  tier: string;
  minInr: number;
  maxInr: number;
  isPlus?: boolean;
  desc: string;
}

export const CANONICAL_BUDGET_TIERS: CanonicalBudgetTier[] = [
  {
    tier: "Conscious Explorer",
    minInr: 0,
    maxInr: 150000,
    desc: "Boutique eco-lodges, private car & chauffeur, authentic Kerala hospitality",
  },
  {
    tier: "Signature Slow-Luxury",
    minInr: 150000,
    maxInr: 350000,
    desc: "Heritage plantation bungalows, private lake cruise, curated artisan dining",
  },
  {
    tier: "Ultra-Luxury Sanctuaries",
    minInr: 350000,
    maxInr: 650000,
    isPlus: true,
    desc: "Private pool villas, bespoke ayurvedic physicians, dedicated naturalist guides",
  },
];

export interface TripBudgetDetails {
  currency: SupportedCurrency;
  minAmount: number;
  maxAmount: number;
  isPlus?: boolean;
  formatted: string;
  guidanceText: string;
  canonicalInr: {
    minInr: number;
    maxInr: number;
    isPlus?: boolean;
    formatted: string;
  };
  rateSnapshot: {
    rate: number;
    inrPerUnit: number;
    referenceDate: string;
    status: ExchangeRateStatus;
    provider: string;
  };
}

// Fallback rates snapshot used only when cold-start network fails
const CONSERVATIVE_FALLBACK_RATES: Record<SupportedCurrency, number> = {
  INR: 1.0,
  USD: 0.01055,
  EUR: 0.00941,
  GBP: 0.00788,
  AED: 0.01055 * AED_PER_USD_PEG, // ~0.03874
};

// In-memory cache
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour active cache
const MAX_STALENESS_MS = 48 * 60 * 60 * 1000; // 48 hours staleness ceiling

let cachedSnapshot: {
  snapshot: ExchangeRatesSnapshot;
  cachedAt: number;
} | null = null;

class CurrencyService {
  /**
   * Validates that rates object contains positive finite numbers for all required currencies.
   */
  validateRates(rates: unknown): boolean {
    if (!rates || typeof rates !== "object") return false;
    const r = rates as Record<string, unknown>;
    for (const curr of SUPPORTED_CURRENCIES) {
      const val = r[curr];
      if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Retrieves exchange rates from Frankfurter (ECB daily reference rates).
   * Validates structure, applies AED peg, and provides caching & graceful fallback.
   */
  async getExchangeRates(forceFresh = false): Promise<ExchangeRatesSnapshot> {
    const now = Date.now();

    // Check valid in-memory cache
    if (!forceFresh && cachedSnapshot && now - cachedSnapshot.cachedAt < CACHE_TTL_MS) {
      return {
        ...cachedSnapshot.snapshot,
        status: "cached",
      };
    }

    try {
      const res = await fetch(FRANKFURTER_API_URL, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Frankfurter API returned HTTP ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as any;

      // Strict validation of response structure and rate values
      if (!data || typeof data !== "object" || !data.rates || typeof data.rates !== "object") {
        throw new Error("Invalid response format from Frankfurter API: missing rates object");
      }

      const { USD, EUR, GBP } = data.rates;
      if (
        typeof USD !== "number" || !Number.isFinite(USD) || USD <= 0 ||
        typeof EUR !== "number" || !Number.isFinite(EUR) || EUR <= 0 ||
        typeof GBP !== "number" || !Number.isFinite(GBP) || GBP <= 0
      ) {
        throw new Error("Invalid or non-positive exchange rates received from Frankfurter API");
      }

      const referenceDate = typeof data.date === "string" && data.date.length >= 8
        ? data.date
        : new Date().toISOString().split("T")[0];

      const rates: Record<SupportedCurrency, number> = {
        INR: 1.0,
        USD,
        EUR,
        GBP,
        AED: USD * AED_PER_USD_PEG,
      };

      const inrPerUnit: Record<SupportedCurrency, number> = {
        INR: 1.0,
        USD: 1 / USD,
        EUR: 1 / EUR,
        GBP: 1 / GBP,
        AED: 1 / (USD * AED_PER_USD_PEG),
      };

      const snapshot: ExchangeRatesSnapshot = {
        base: "INR",
        referenceDate,
        lastUpdated: new Date().toISOString(),
        status: "live",
        provider: "Frankfurter (European Central Bank reference rates)",
        disclaimer: "Daily reference rates published by the European Central Bank via Frankfurter. AED rate derived from official USD peg (1 USD = 3.6725 AED). Indicative rates for trip planning only.",
        rates,
        inrPerUnit,
      };

      cachedSnapshot = {
        snapshot,
        cachedAt: now,
      };

      logger.info({ referenceDate, usdRate: USD }, "[CurrencyService] Successfully updated live exchange rates from Frankfurter");
      return snapshot;
    } catch (err: any) {
      logger.warn({ err: err?.message }, "[CurrencyService] Failed to fetch live exchange rates from Frankfurter API");

      // Check if we have an existing cached rate within maximum staleness window
      if (cachedSnapshot && now - cachedSnapshot.cachedAt < MAX_STALENESS_MS) {
        logger.info(
          { ageMinutes: Math.round((now - cachedSnapshot.cachedAt) / 60000) },
          "[CurrencyService] Serving stale cached exchange rates due to upstream network issue"
        );
        return {
          ...cachedSnapshot.snapshot,
          status: "stale",
        };
      }

      // Conservative emergency fallback — clearly labeled
      const inrPerUnit: Record<SupportedCurrency, number> = {
        INR: 1.0,
        USD: 1 / CONSERVATIVE_FALLBACK_RATES.USD,
        EUR: 1 / CONSERVATIVE_FALLBACK_RATES.EUR,
        GBP: 1 / CONSERVATIVE_FALLBACK_RATES.GBP,
        AED: 1 / CONSERVATIVE_FALLBACK_RATES.AED,
      };

      return {
        base: "INR",
        referenceDate: "2026-10-22",
        lastUpdated: new Date().toISOString(),
        status: "fallback",
        provider: "Offline Indicative Reference (Upstream unavailable)",
        disclaimer: "Conservative reference exchange rates applied because upstream exchange-rate provider was temporarily unavailable. AED pegged to USD (1 USD = 3.6725 AED).",
        rates: { ...CONSERVATIVE_FALLBACK_RATES },
        inrPerUnit,
      };
    }
  }

  /**
   * Deterministically converts INR amount to target currency.
   * targetAmount = inrAmount * (unitsPerInr)
   */
  convert(amountInr: number, currency: SupportedCurrency, rates: Record<SupportedCurrency, number>): number {
    const rate = rates[currency] || 1;
    return amountInr * rate;
  }

  /**
   * Formats a currency amount with sensible rounding for display only.
   * Never mutates raw values.
   */
  formatAmount(amount: number, currency: SupportedCurrency, isLakhs = false): string {
    if (currency === "INR") {
      if (isLakhs) {
        const lakhs = amount / 100000;
        return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
      }
      return `₹${Math.round(amount).toLocaleString("en-IN")}`;
    }

    // Foreign currency display rounding rules
    let rounded: number;
    if (amount >= 10000) {
      rounded = Math.round(amount / 100) * 100;
    } else if (amount >= 2000) {
      rounded = Math.round(amount / 50) * 50;
    } else if (amount >= 500) {
      rounded = Math.round(amount / 10) * 10;
    } else {
      rounded = Math.round(amount / 5) * 5;
    }

    const formattedNum = rounded.toLocaleString("en-US");
    switch (currency) {
      case "USD":
        return `$${formattedNum}`;
      case "EUR":
        return `€${formattedNum}`;
      case "GBP":
        return `£${formattedNum}`;
      case "AED":
        return `د.إ ${formattedNum}`;
      default:
        return `${currency} ${formattedNum}`;
    }
  }

  /**
   * Computes authoritative, deterministic trip budget details.
   */
  async calculateTripBudget(
    budgetTier: string,
    durationDays: number,
    travelersCount: number,
    targetCurrency: string
  ): Promise<TripBudgetDetails> {
    const currency: SupportedCurrency = SUPPORTED_CURRENCIES.includes(targetCurrency as SupportedCurrency)
      ? (targetCurrency as SupportedCurrency)
      : "INR";

    const snapshot = await this.getExchangeRates();
    const rate = snapshot.rates[currency] || 1;
    const inrPerUnit = snapshot.inrPerUnit[currency] || 1;

    // Match budget tier or fallback to Signature Slow-Luxury
    const tierConfig =
      CANONICAL_BUDGET_TIERS.find((t) => t.tier.toLowerCase() === budgetTier.toLowerCase()) ||
      CANONICAL_BUDGET_TIERS[1];

    const minInr = tierConfig.minInr;
    const maxInr = tierConfig.maxInr;
    const isPlus = Boolean(tierConfig.isPlus);

    // Deterministic conversion: target = INR * rate
    const minAmount = this.convert(minInr, currency, snapshot.rates);
    const maxAmount = this.convert(maxInr, currency, snapshot.rates);

    // Canonical INR formatted string
    const inrMinFormatted = minInr === 0 ? "" : this.formatAmount(minInr, "INR", true);
    const inrMaxFormatted = `${this.formatAmount(maxInr, "INR", true)}${isPlus ? "+" : ""}`;
    const inrRangeFormatted = minInr === 0 ? `Under ${inrMaxFormatted}` : `${inrMinFormatted} – ${inrMaxFormatted}`;

    // Target currency formatted string
    let targetFormatted: string;
    if (currency === "INR") {
      targetFormatted = inrRangeFormatted;
    } else {
      const minTargetStr = this.formatAmount(minAmount, currency);
      const maxTargetStr = `${this.formatAmount(maxAmount, currency)}${isPlus ? "+" : ""}`;
      targetFormatted = minInr === 0 ? `Under ${maxTargetStr}` : `${minTargetStr} – ${maxTargetStr}`;
    }

    // Guidance text matching numbers deterministically
    let guidanceText: string;
    const guestsLabel = `${travelersCount} guest${travelersCount > 1 ? "s" : ""}`;
    const durationLabel = `${durationDays} days`;

    if (currency === "INR") {
      const minDisp = minInr === 0 ? "Up to" : `₹${minInr.toLocaleString("en-IN")} –`;
      const maxDisp = `₹${maxInr.toLocaleString("en-IN")}${isPlus ? "+" : ""}`;
      guidanceText = `Indicative slow-luxury estimate: ${minDisp} ${maxDisp} for ${guestsLabel} (${durationLabel}). Covers private chauffeur-driven vehicle, curated boutique stays, daily artisanal breakfast, and signature slow-travel experiences.`;
    } else {
      const minDisp = minInr === 0 ? "Up to" : `${this.formatAmount(minAmount, currency)} –`;
      const maxDisp = `${this.formatAmount(maxAmount, currency)}${isPlus ? "+" : ""}`;
      guidanceText = `Indicative slow-luxury estimate: ${minDisp} ${maxDisp} (~${inrRangeFormatted}) for ${guestsLabel} (${durationLabel}). Covers private chauffeur-driven vehicle, curated boutique stays, daily artisanal breakfast, and signature slow-travel experiences.`;
    }

    return {
      currency,
      minAmount,
      maxAmount,
      isPlus,
      formatted: targetFormatted,
      guidanceText,
      canonicalInr: {
        minInr,
        maxInr,
        isPlus,
        formatted: inrRangeFormatted,
      },
      rateSnapshot: {
        rate,
        inrPerUnit,
        referenceDate: snapshot.referenceDate,
        status: snapshot.status,
        provider: snapshot.provider,
      },
    };
  }

  // Synchronous conversion for cached/fallback usage
  convertSync(
    amountInr: number,
    targetCurrency: SupportedCurrency,
    rates: Record<SupportedCurrency, number>
  ): number {
    return this.convert(amountInr, targetCurrency, rates);
  }
}

export const currencyService = new CurrencyService();
