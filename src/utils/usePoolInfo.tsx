import type { IExchangeInfo, IReserve } from "@saberhq/stableswap-sdk";
import { calculateVirtualPrice } from "@saberhq/stableswap-sdk";
import type { Percent } from "@saberhq/token-utils";
import { Fraction } from "@saberhq/token-utils";

import { useStableSwap } from "./useStableSwap";

interface PoolInfo {
  reserves: {
    reserve: IReserve;
    allocation: Percent;
  }[];
  virtualPrice?: Fraction;
  /**
   * Total value locked in $ (using virtual price)
   */
  totalValueLocked?: Fraction;
}

export const usePoolInfo = (): Partial<PoolInfo> => {
  const { exchangeInfo } = useStableSwap();
  if (!exchangeInfo) {
    return {};
  }
  return calculatePoolInfo(exchangeInfo);
};

export const calculatePoolInfo = (exchangeInfo: IExchangeInfo): PoolInfo => {
  const totalTokens =
    exchangeInfo.reserves
      .map((r) => r.amount.asFraction)
      .reduce((acc, el) => acc.add(el)) ?? new Fraction(0, 1);
  const reserves = exchangeInfo.reserves.map((reserve) => ({
    reserve,
    allocation: reserve.amount.divideBy(totalTokens),
  }));

  const virtualPrice = calculateVirtualPrice(exchangeInfo) ?? undefined;
  const totalValueLocked = totalTokens;

  return { totalValueLocked, reserves, virtualPrice };
};
