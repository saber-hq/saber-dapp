import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import { calculateEstimatedWithdrawOneAmount } from "@saberhq/stableswap-sdk";
import type { Fraction, Token } from "@saberhq/token-utils";
import { Percent, TokenAmount, ZERO } from "@saberhq/token-utils";
import JSBI from "jsbi";

import type { WrappedToken } from "../../../components/pages/PoolView/Withdraw/wrappedToken";
import type { WithdrawCalculationResult } from ".";

/**
 * Calculates withdrawOne parameters
 * @param param0
 * @returns
 */
export const calculateWithdrawOne = ({
  exchangeInfo,
  poolTokenAmount,
  withdrawToken,
  virtualPrice,
  maxSlippagePercent,
}: {
  exchangeInfo: IExchangeInfo;
  poolTokenAmount: TokenAmount;
  withdrawToken: WrappedToken;
  virtualPrice: Fraction;
  maxSlippagePercent: Percent;
}): WithdrawCalculationResult => {
  const tokens = exchangeInfo.reserves.map((r) => r.amount.token) as [
    Token,
    Token,
  ];
  // Withdraw one
  const withdrawOneAmount = calculateEstimatedWithdrawOneAmount({
    exchange: exchangeInfo,
    poolTokenAmount: poolTokenAmount,
    withdrawToken: withdrawToken.value,
  });

  const totalFee = withdrawOneAmount
    ? new TokenAmount(
        withdrawToken.value,
        JSBI.add(
          withdrawOneAmount.swapFee.raw,
          withdrawOneAmount.withdrawFee.raw,
        ),
      )
    : undefined;

  const withdrawTokenValue = withdrawToken.value;

  const renderedFee = totalFee && !totalFee.isZero() ? totalFee : undefined;

  const tokenCalcs =
    tokens?.map((tok) =>
      tok.equals(withdrawTokenValue)
        ? [withdrawOneAmount?.withdrawAmount, renderedFee]
        : [undefined, undefined],
    ) ?? [];
  const estimates = tokenCalcs.map((c) => c[0]) as [
    TokenAmount | undefined,
    TokenAmount | undefined,
  ];
  const fees = tokenCalcs.map((c) => c[1]) as [
    TokenAmount | undefined,
    TokenAmount | undefined,
  ];

  const expected = calculateExpectedWithdrawOneAmount(
    virtualPrice,
    tokens,
    poolTokenAmount,
  );

  // minimum amounts to receive from withdraw, considering slippage
  const minimums = (tokens?.map((tok, i) => {
    return (
      expected[i]?.reduceBy(maxSlippagePercent) ?? new TokenAmount(tok, ZERO)
    );
  }) ?? [undefined, undefined]) as [
    TokenAmount | undefined,
    TokenAmount | undefined,
  ];
  const slippages = estimates.map((estimate, i) => {
    const estimateRaw = estimate?.raw;
    const expectedRaw = expected[i]?.raw;
    if (!estimateRaw || !expectedRaw) {
      return undefined;
    }
    return new Percent(JSBI.subtract(expectedRaw, estimateRaw), expectedRaw);
  }) as [Percent | undefined, Percent | undefined];

  const feePercents = fees.map((fee, i) => {
    const estimate = estimates[i];
    return fee && estimate && !estimate.isZero()
      ? fee.divideBy(estimate)
      : undefined;
  }) as [Percent | undefined, Percent | undefined];

  return {
    estimates,
    fees,
    feePercents,
    minimums,
    slippages,
  };
};

/**
 * WithdrawOne amount if each LP = virtualPrice.
 * @param virtualPrice
 * @param unitPrice
 * @param withdrawPoolTokenAmount
 * @returns
 */
const calculateExpectedWithdrawOneAmount = (
  virtualPrice: Fraction,
  tokens: [Token, Token],
  withdrawPoolTokenAmount: TokenAmount,
): [TokenAmount, TokenAmount] => {
  const lpTokenValue = virtualPrice.multiply(withdrawPoolTokenAmount.raw);
  return [
    new TokenAmount(tokens[0], lpTokenValue.toFixed(0)),
    new TokenAmount(tokens[1], lpTokenValue.toFixed(0)),
  ];
};
