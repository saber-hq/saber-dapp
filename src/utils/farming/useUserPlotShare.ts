import type { Fraction, TokenAmount } from "@saberhq/token-utils";
import { useMemo } from "react";

import { useStableSwap } from "../useStableSwap";

interface UserPlotShare {
  stakeValue: Fraction | null;
  stakeValueUSD: Fraction | null;
}

export const useUserPlotShare = ({
  stakedAmount,
}: {
  stakedAmount: TokenAmount | null;
}): UserPlotShare => {
  const { currencyPriceUSD, virtualPrice } = useStableSwap();

  const stakeValue = useMemo(() => {
    if (!virtualPrice || !stakedAmount) {
      return null;
    }
    return virtualPrice.multiply(stakedAmount.asFraction);
  }, [stakedAmount, virtualPrice]);
  const stakeValueUSD = useMemo(() => {
    if (!stakeValue || !currencyPriceUSD) {
      return null;
    }
    return stakeValue.multiply(currencyPriceUSD);
  }, [currencyPriceUSD, stakeValue]);

  return { stakeValue, stakeValueUSD };
};
