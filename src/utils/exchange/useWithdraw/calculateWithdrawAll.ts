import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import { calculateEstimatedWithdrawAmount } from "@saberhq/stableswap-sdk";
import type { TokenAmount } from "@saberhq/token-utils";
import { Percent } from "@saberhq/token-utils";

import type { WithdrawCalculationResult } from ".";

export const calculateWithdrawAll = ({
  poolTokenAmount,
  exchangeInfo,
  maxSlippagePercent,
}: {
  poolTokenAmount: TokenAmount;
  exchangeInfo: IExchangeInfo;
  maxSlippagePercent: Percent;
}): WithdrawCalculationResult => {
  const result = calculateEstimatedWithdrawAmount({
    poolTokenAmount,
    reserves: exchangeInfo.reserves,
    fees: exchangeInfo.fees,
    lpTotalSupply: exchangeInfo.lpTotalSupply,
  });

  // minimum amounts to receive from withdraw, considering slippage
  const minimums = (result.withdrawAmounts.map((amount) =>
    amount.reduceBy(maxSlippagePercent),
  ) ?? [undefined, undefined]) as [
    TokenAmount | undefined,
    TokenAmount | undefined,
  ];

  return {
    estimates: result.withdrawAmounts,
    fees: result.fees,
    feePercents: [
      result.fees[0].divideBy(result.withdrawAmountsBeforeFees[0]),
      result.fees[1].divideBy(result.withdrawAmountsBeforeFees[1]),
    ] as const,
    minimums,
    slippages: [new Percent(0, 1), new Percent(0, 1)] as const,
  };
};
