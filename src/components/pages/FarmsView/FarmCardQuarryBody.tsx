import { useQuarry } from "@quarryprotocol/react-quarry";
import { SBR_ADDRESS } from "@saberhq/saber-periphery";
import { useTokens } from "@saberhq/sail";
import { exists, mapN } from "@saberhq/solana-contrib";
import { Fraction, Percent } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import React, { useMemo } from "react";

import { useStats } from "../../../contexts/stats";
import { calculateAPYFromDPR } from "../../../utils/calculateAPY";
import { CurrencyMarket } from "../../../utils/currencies";
import { usePlotPriceStats } from "../../../utils/farming/usePlotPriceStats";
import { formatCurrencySmart, formatPercent } from "../../../utils/format";
import { useStableSwap } from "../../../utils/useStableSwap";
import { TokenIcon } from "../../common/TokenIcon";
import { LineItem } from "./LineItem";

const TOKEN_ICON_SIZE = 24;

export const FarmCardQuarryBody: React.FC = () => {
  const { totalDeposits, totalRewardsPerDay } = useQuarry();
  const { currency, currencyPriceUSD, exchangeInfo, swap } = useStableSwap();
  const { tvl, tvlUSD, apyUSD, aprUSD } = usePlotPriceStats({
    totalDeposits,
    rewardsPerDay: totalRewardsPerDay ?? null,
  });
  const total = useMemo(() => {
    return exchangeInfo?.reserves
      .map((r) => r.amount.asFraction)
      .reduce((acc, el) => acc.add(el));
  }, [exchangeInfo?.reserves]);

  const [SBR_TOKEN, LP_TOKEN] = useTokens(
    useMemo(
      () => [new PublicKey(SBR_ADDRESS), swap?.state.poolTokenMint],
      [swap?.state.poolTokenMint],
    ),
  );

  const totalUSD = mapN(
    (currencyPriceUSD, total) => currencyPriceUSD * total.asNumber,
    currencyPriceUSD,
    total,
  );

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

  const stats = useStats().data?.find(
    (poolStats) => poolStats.ammId === swap?.config.swapAccount.toString(),
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
                  minimumFractionDigits: 2,
                },
              )
          : aprUSD
            ? formatPercent(aprUSD)
            : null,
    [aprUSD, apyUSD, tvl],
  );

  const feesApyStr = useMemo(() => {
    const vol24HUSD =
      stats && exists(currencyPriceUSD) && stats.stats.vol24h
        ? stats.stats.vol24h * currencyPriceUSD
        : null;
    const fees24HUSD =
      vol24HUSD && swap
        ? vol24HUSD * swap.state.fees.trade.asFraction.asNumber
        : null;
    const feesAPY =
      fees24HUSD && totalUSD
        ? calculateAPYFromDPR(fees24HUSD / totalUSD)
        : null;

    return feesAPY ? formatPercent(Percent.fromNumber(feesAPY, 5)) : "?%";
  }, [currencyPriceUSD, stats, swap, totalUSD]);

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
      <LineItem label="APY">
        {apyStr ? (
          <div tw="flex">
            <div>{`${apyStr}`}</div>
            <TokenIcon
              tw="mx-1"
              size={TOKEN_ICON_SIZE}
              token={SBR_TOKEN?.data}
            />
            {"+"}
            <div>{`${feesApyStr}`}</div>
            <TokenIcon
              tw="mx-1"
              size={TOKEN_ICON_SIZE}
              token={LP_TOKEN?.data}
            />
          </div>
        ) : (
          "?% + ?%"
        )}
      </LineItem>
    </>
  );
};
