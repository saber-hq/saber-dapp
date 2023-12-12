import type { IWithdrawOneResult } from "@saberhq/stableswap-sdk";
import { calculateEstimatedWithdrawOneAmount } from "@saberhq/stableswap-sdk";
import * as Sentry from "@sentry/react";
import { mapValues } from "lodash-es";
import { useMemo } from "react";

import { useStableSwap } from "../../../../utils/useStableSwap";
import { useStableSwapTokens } from "../../../../utils/useStableSwapTokens";
import type { WrappedToken } from "./wrappedToken";

/**
 * Max withdraw amount for a stable swap.
 * @param token
 * @returns
 */
export const useMaxWithdrawOneAmount = (
  token?: WrappedToken,
): IWithdrawOneResult | undefined => {
  const { exchangeInfo } = useStableSwap();
  const { poolTokenAccount } = useStableSwapTokens();
  const amount = poolTokenAccount?.balance;
  return useMemo((): IWithdrawOneResult | undefined => {
    if (!exchangeInfo || !amount || !token) {
      return undefined;
    }
    if (amount.isZero()) {
      return undefined;
    }
    try {
      const maxEstimate = calculateEstimatedWithdrawOneAmount({
        exchange: exchangeInfo,
        poolTokenAmount: amount,
        withdrawToken: token.value,
      });
      return mapValues(maxEstimate, (amt) => token.underlyingAmount(amt));
    } catch (e) {
      Sentry.captureException(e, { tags: { action: "error" } });
      console.error("Max withdraw one error", e);
      return undefined;
    }
  }, [exchangeInfo, amount, token]);
};
