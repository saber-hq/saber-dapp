import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import { computeD } from "@saberhq/stableswap-sdk";
import JSBI from "jsbi";

// https://github.com/curvefi/curve-contract/blob/b0bbf77f8f93c9c5f4e415bce9cd71f0cdee960e/contracts/pool-templates/base/SwapTemplateBase.vy#L267
export const calculateLPTokenAmount = (
  exchange: IExchangeInfo,
  amountA: JSBI,
  amountB: JSBI,
  isDeposit: boolean,
): JSBI => {
  const D0 = computeD(
    exchange.ampFactor,
    exchange.reserves[0].amount.raw,
    exchange.reserves[1].amount.raw,
  );

  const balancesA = isDeposit
    ? JSBI.add(exchange.reserves[0].amount.raw, amountA)
    : JSBI.subtract(exchange.reserves[0].amount.raw, amountA);

  const balancesB = isDeposit
    ? JSBI.add(exchange.reserves[1].amount.raw, amountB)
    : JSBI.subtract(exchange.reserves[1].amount.raw, amountB);

  const D1 = computeD(exchange.ampFactor, balancesA, balancesB);
  const diff = isDeposit ? JSBI.subtract(D1, D0) : JSBI.subtract(D0, D1);
  return JSBI.divide(JSBI.multiply(diff, exchange.lpTotalSupply.raw), D0);
};
