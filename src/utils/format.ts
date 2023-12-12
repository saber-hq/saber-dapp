import type { IFormatUint, Percent } from "@saberhq/token-utils";
import { Fraction, TokenAmount, ZERO } from "@saberhq/token-utils";
import BN from "bn.js";
import JSBI from "jsbi";

import { CURRENCY_INFO, CurrencyMarket } from "./currencies";

export const FORMAT_PERCENT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 5,
  style: "percent",
};

export const PERCENT_FORMATTER = new Intl.NumberFormat(
  undefined,
  FORMAT_PERCENT,
);

export const fractionToFloat = (frac: Fraction): number => {
  if (JSBI.equal(frac.denominator, ZERO)) {
    return JSBI.greaterThan(frac.numerator, ZERO)
      ? Number.POSITIVE_INFINITY
      : JSBI.lessThan(frac.numerator, ZERO)
        ? Number.NEGATIVE_INFINITY
        : Number.NaN;
  }
  return parseFloat(frac.toFixed(10));
};

export const formatPercent = (percent: Percent): string => {
  return `${percent.toSignificant()}%`;
};

export const formatPrecise = (percent: Percent): string => {
  return (percent.asFraction.asNumber * 100).toLocaleString(undefined, {
    maximumFractionDigits: 10,
  });
};

export const FORMAT_DOLLARS: Intl.NumberFormatOptions = {
  currency: "USD",
  style: "currency",
};

export const FORMAT_DOLLARS_WHOLE: Intl.NumberFormatOptions = {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

export const DOLLAR_FORMATTER_WHOLE = new Intl.NumberFormat(
  undefined,
  FORMAT_DOLLARS_WHOLE,
);

export const formatCurrency = (
  amount: number,
  currency: CurrencyMarket,
  numberFormatOptions: Intl.NumberFormatOptions = {},
): string => {
  if (currency === CurrencyMarket.USD) {
    return amount.toLocaleString(undefined, {
      ...FORMAT_DOLLARS,
      ...numberFormatOptions,
    });
  }
  const fmt = amount.toLocaleString(undefined, {
    minimumSignificantDigits: 4,
    ...numberFormatOptions,
  });
  const info = CURRENCY_INFO[currency];
  const prefix = info.prefix;
  if (prefix) {
    return `${prefix}${fmt}`;
  }
  return `${fmt} ${info.symbol}`;
};

export const formatCurrencyWhole = (
  amount: number,
  currency: CurrencyMarket,
  numberFormatOptions: Intl.NumberFormatOptions = {},
): string => {
  if (currency === CurrencyMarket.USD) {
    return amount.toLocaleString(undefined, {
      ...FORMAT_DOLLARS_WHOLE,
      ...numberFormatOptions,
    });
  }
  const fmt = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...numberFormatOptions,
  });
  const info = CURRENCY_INFO[currency];
  const prefix = info.prefix;
  if (prefix) {
    return `${prefix}${fmt}`;
  }
  return `${fmt} ${info.symbol}`;
};

export const formatCurrencySmart = (
  amount: number | Fraction,
  currency: CurrencyMarket,
  numberFormatOptions?: Intl.NumberFormatOptions,
): string => {
  const amtFloat =
    amount instanceof Fraction ||
    (typeof amount === "object" && (amount as Record<string, unknown>)?.toFixed)
      ? amount.asNumber
      : amount;
  const threshold =
    currency === CurrencyMarket.USD
      ? 100
      : currency === CurrencyMarket.BTC
        ? 100
        : 1;
  return amtFloat > threshold
    ? formatCurrencyWhole(amtFloat, currency, numberFormatOptions)
    : formatCurrency(amtFloat, currency, numberFormatOptions);
};

/**
 * @warning For end-user display purposes only. It loses precision and does rounding
 *
 * If (Whole number digits > softMaximumSignificantDigits)
 *   Rounds to whole number towards 0
 * Otherwise
 *   Defaults to token.decimals, but respects numberFormatOptions as an override
 *
 * Example for softMaximumSignificantDigits = 7 and token with 6 digits
 *
 * 1234.87654321 => 1234.876 (7 significant figures)
 * 1234567.87654321 => 1234567 (rounded down)
 * 123456789.321 => 123456789
 * 1.87654321 => 1.876543
 *
 *
 * If 0, returns the original TokenAmount
 */
export const formatTokenWithSoftLimit = (
  ta: TokenAmount,
  softMaximumSignificantDigits = 7,
  numberFormatOptions: Intl.NumberFormatOptions,
  locale = "en-US",
): string => {
  if (
    Number.isNaN(softMaximumSignificantDigits) ||
    softMaximumSignificantDigits <= 0
  ) {
    throw new Error("softMaximumSignificantDigits must be greater than 0");
  }

  const tokenRawAmount = new BN(ta.raw.toString());
  const dropDecimalsAfter = new BN(10).pow(
    new BN(ta.token.decimals + softMaximumSignificantDigits - 1),
  );
  const decimalMultiplier = new BN(10 ** ta.token.decimals);

  if (ta.greaterThan(dropDecimalsAfter)) {
    // Round down to display integer amount
    const roundedRaw = new BN(
      Math.floor(Number(tokenRawAmount.toString()) / 10 ** ta.token.decimals),
    );
    const roundedInt = roundedRaw.mul(decimalMultiplier);
    const wholeNumberFormatOptions: IFormatUint = {
      locale,
      numberFormatOptions: Object.assign({}, numberFormatOptions, {
        maximumFractionDigits: 0,
      }),
    };
    return new TokenAmount(ta.token, roundedInt).format(
      wholeNumberFormatOptions,
    );
  }

  // maximumSignificantDigits is stronger than maximumFractionDigits, so if maximumFractionDigits
  // was specified, we should use that instead
  if (numberFormatOptions.maximumFractionDigits) {
    const overriddenFormatOptions: IFormatUint = {
      numberFormatOptions: Object.assign(
        {
          locale,
          maximumFractionDigits: ta.token.decimals,
        },
        numberFormatOptions,
      ),
    };
    return ta.format(overriddenFormatOptions);
  }

  const defaultFormatOptions: IFormatUint = {
    numberFormatOptions: Object.assign(
      {
        locale,
        maximumSignificantDigits: softMaximumSignificantDigits,
      },
      numberFormatOptions,
    ),
  };
  return ta.format(defaultFormatOptions);
};
