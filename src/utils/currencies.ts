import type { Token } from "@saberhq/token-utils";
import { mapValues } from "lodash-es";

/**
 * A market
 */
export enum CurrencyMarket {
  USD = "USD",
  BTC = "BTC",
  LUNA = "LUNA",
  FTT = "FTT",
  SRM = "SRM",
  SOL = "SOL",
  SBR = "SBR",
  ETH = "ETH",
  EUR = "EUR",
  TRY = "TRY",
}

export const getMarketTag = (market: CurrencyMarket): string =>
  `saber-mkt-${market.toString().toLocaleLowerCase()}`;

export const CURRENCY_MARKET_TAGS: { [C in CurrencyMarket]: string } =
  mapValues(CurrencyMarket, (value) => getMarketTag(value));

export const getMarketFromTag = (tag: string): CurrencyMarket | null => {
  return (
    (Object.entries(CURRENCY_MARKET_TAGS).find(
      ([_, v]) => v === tag,
    )?.[0] as CurrencyMarket) ?? null
  );
};

export const getMarket = (token: Token): CurrencyMarket => {
  const marketTag = token.info.tags?.find((tag) =>
    tag.startsWith("saber-mkt-"),
  );
  if (!marketTag) {
    return CurrencyMarket.USD;
  }
  return getMarketFromTag(marketTag) ?? CurrencyMarket.USD;
};

export const getMarketIfExists = (token: Token): CurrencyMarket | null => {
  const marketTag = token.info.tags?.find((tag) =>
    tag.startsWith("saber-mkt-"),
  );
  if (!marketTag) {
    return null;
  }
  return getMarketFromTag(marketTag) ?? null;
};

/**
 * Default options for formatting the currency in large amounts.
 */
export const CURRENCY_INFO: {
  [C in CurrencyMarket]: {
    name: string;
    symbol: string;
    prefix?: string;
    largeFormat: Intl.NumberFormat;
  };
} = {
  USD: {
    name: "Stablecoin",
    symbol: "USD",
    prefix: "$",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }),
  },
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    prefix: "₿",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 8,
    }),
  },
  LUNA: {
    name: "Luna",
    symbol: "LUNA",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }),
  },
  FTT: {
    name: "FTT",
    symbol: "FTT",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 4,
    }),
  },
  SRM: {
    name: "SRM",
    symbol: "SRM",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 3,
    }),
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    prefix: "◎",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 3,
    }),
  },
  SBR: {
    name: "Saber",
    symbol: "SBR",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }),
  },
  ETH: {
    name: "Ether",
    symbol: "ETH",
    prefix: "Ξ",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 3,
    }),
  },
  EUR: {
    name: "EUR Stablecoin",
    symbol: "EUR",
    prefix: "€",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }),
  },
  TRY: {
    name: "Turkish Lira",
    symbol: "TRY",
    prefix: "₺",
    largeFormat: new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }),
  },
};
