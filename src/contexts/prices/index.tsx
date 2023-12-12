import { mapN } from "@saberhq/solana-contrib";
import { useCoinGeckoPrices } from "@sunnyag/react-coingecko";

import { CurrencyMarket } from "../../utils/currencies";

const TOKENS = [
  "bitcoin",
  "ftx-token",
  "saber",
  "serum",
  "terra-luna",
  "solana",
  "ethereum",
  "tether-eurt",
  "bilira",
] as const;

export const CURRENCY_TOKEN_MAP: {
  [K in Exclude<CurrencyMarket, "USD">]: (typeof TOKENS)[number];
} = {
  [CurrencyMarket.BTC]: "bitcoin",
  [CurrencyMarket.FTT]: "ftx-token",
  [CurrencyMarket.SBR]: "saber",
  [CurrencyMarket.SRM]: "serum",
  [CurrencyMarket.LUNA]: "terra-luna",
  [CurrencyMarket.SOL]: "solana",
  [CurrencyMarket.ETH]: "ethereum",
  [CurrencyMarket.EUR]: "tether-eurt",
  [CurrencyMarket.TRY]: "bilira",
};

export const usePrices = () => {
  return useCoinGeckoPrices(TOKENS);
};

export const usePrice = (currency: CurrencyMarket) => {
  const { data: prices } = usePrices();
  return currency === CurrencyMarket.USD
    ? 1
    : mapN((prices) => prices[CURRENCY_TOKEN_MAP[currency]], prices);
};
