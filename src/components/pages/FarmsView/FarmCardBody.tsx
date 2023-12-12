import { Fraction } from "@saberhq/token-utils";
import React, { useMemo } from "react";

import { CurrencyMarket } from "../../../utils/currencies";
import type { PlotStats } from "../../../utils/farming/calculatePlotStats";
import { usePlotPriceStats } from "../../../utils/farming/usePlotPriceStats";
import { formatCurrencySmart, formatPercent } from "../../../utils/format";
import { useStableSwap } from "../../../utils/useStableSwap";
import { LineItem } from "./LineItem";

interface Props {
  stats: PlotStats;
}

export const FarmCardBody: React.FC<Props> = ({ stats }: Props) => {
  const { currency } = useStableSwap();
  const { tvl, tvlUSD, apyUSD, aprUSD } = usePlotPriceStats(stats);

  const tvlStr = useMemo(
    () => (tvl && currency ? formatCurrencySmart(tvl, currency) : null),
    [tvl, currency],
  );
  const tvlUSDStr = useMemo(
    () =>
      tvlUSD && currency && currency !== CurrencyMarket.USD
        ? formatCurrencySmart(tvlUSD, CurrencyMarket.USD)
        : null,
    [tvlUSD, currency],
  );

  const apyStr = useMemo(
    () =>
      tvl?.isZero() && !aprUSD?.isZero()
        ? "∞"
        : apyUSD
          ? apyUSD.asFraction.greaterThan(new Fraction(100_000_000_000_000, 1))
            ? "🤯 %"
            : parseFloat(apyUSD.asFraction.toFixed(10)).toLocaleString(
                undefined,
                {
                  style: "percent",
                },
              )
          : aprUSD
            ? formatPercent(aprUSD)
            : null,
    [aprUSD, apyUSD, tvl],
  );

  return (
    <>
      <LineItem label="Total Staked">
        {tvlStr && (
          <>
            {tvlStr}
            {tvlUSDStr && currency !== CurrencyMarket.USD && ` (${tvlUSDStr})`}
          </>
        )}
      </LineItem>
      <LineItem label="APY">{apyStr}</LineItem>
    </>
  );
};
