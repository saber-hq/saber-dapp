import { Fraction, Percent } from "@saberhq/token-utils";
import { useMemo } from "react";

import { useStableSwap } from "../useStableSwap";
import type { PlotStats } from "./calculatePlotStats";
import { useTokenPrice } from "./useTokenPrice";

interface PlotPriceStats {
  tvl: Fraction | null;
  tvlUSD: Fraction | null;
  aprUSD: Percent | null;
  apyUSD: Percent | null;
}

/**
 * Stats that are derived with plot price
 * @param param0
 * @returns
 */
export const usePlotPriceStats = ({
  totalDeposits,
  rewardsPerDay,
}: Pick<PlotStats, "totalDeposits" | "rewardsPerDay">): PlotPriceStats => {
  const { currencyPriceUSD, virtualPrice } = useStableSwap();

  const tvl = useMemo(() => {
    if (!virtualPrice || !totalDeposits) {
      return null;
    }
    return virtualPrice.multiply(totalDeposits.asFraction);
  }, [totalDeposits, virtualPrice]);
  const tvlUSD = useMemo(() => {
    if (!tvl || !currencyPriceUSD) {
      return null;
    }
    return tvl.multiply(Fraction.fromNumber(currencyPriceUSD));
  }, [currencyPriceUSD, tvl]);

  const { price } = useTokenPrice();
  const rewardsPerDayUSD = useMemo(() => {
    if (price && rewardsPerDay) {
      return rewardsPerDay.multiply(Fraction.fromNumber(price));
    }
    return null;
  }, [price, rewardsPerDay]);

  const dpyUSD = useMemo(() => {
    if (rewardsPerDayUSD && tvlUSD) {
      if (tvlUSD.greaterThan(0)) {
        const frax = rewardsPerDayUSD.divide(tvlUSD);
        return new Percent(frax.numerator, frax.denominator);
      } else {
        return new Percent(0);
      }
    }
    return null;
  }, [rewardsPerDayUSD, tvlUSD]);

  const aprUSD = useMemo(() => {
    if (dpyUSD) {
      return dpyUSD.multiply(365);
    }
    return null;
  }, [dpyUSD]);

  const apyUSD = useMemo(() => {
    if (dpyUSD) {
      const num = parseFloat(dpyUSD.add(1).asFraction.toFixed(6)) ** 365 - 1;
      const numerator = Math.floor(num * 10_000_000_000);
      if (Number.isFinite(numerator)) {
        return new Percent(numerator, 10_000_000_000);
      }
      return null;
    }
    return null;
  }, [dpyUSD]);

  return { tvl, tvlUSD, aprUSD, apyUSD };
};
