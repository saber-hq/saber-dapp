import { exists } from "@saberhq/solana-contrib";
import { Fraction } from "@saberhq/token-utils";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import { CURRENCY_TOKEN_MAP, usePrices } from "../../contexts/prices";
import { useRouter } from "../../contexts/router";
import { CurrencyMarket, getMarket } from "../currencies";

const useTVLInner = (): {
  tvlMap: Record<string, Fraction>;
  tvlUSD: Fraction | null;
  loading: boolean;
} => {
  const { exchangeMap, loading } = useRouter();
  const { data: prices } = usePrices();

  const { tvlMap, tvlUSD } = useMemo(() => {
    const tvlMap: Record<string, Fraction> = {};
    const tvlUSD = Object.values(exchangeMap).reduce((acc, pool) => {
      const currency = getMarket(pool.pair.token0);
      const currencyPrice =
        currency === CurrencyMarket.USD
          ? 1
          : prices?.[CURRENCY_TOKEN_MAP[currency]];
      const tvlUSD =
        (exists(currencyPrice) &&
          pool.info.reserves
            .filter(
              (r) =>
                !r.amount.token.name.includes("Cashio") &&
                !r.amount.token.name.includes("Fabric"),
            )
            .map((r) => r.amount.asFraction)
            .reduce((acc, el) => acc.add(el))
            .multiply(Fraction.fromNumber(currencyPrice))) ||
        null;
      if (tvlUSD) {
        tvlMap[pool.exchange.id] = tvlUSD;
        return acc.add(tvlUSD);
      }
      return acc;
    }, new Fraction(0));
    return { tvlMap, tvlUSD };
  }, [exchangeMap, prices]);

  return {
    tvlMap,
    tvlUSD,
    loading: loading || Object.values(exchangeMap).length === 0,
  };
};

export const { useContainer: useTVL, Provider: TVLProvider } =
  createContainer(useTVLInner);
