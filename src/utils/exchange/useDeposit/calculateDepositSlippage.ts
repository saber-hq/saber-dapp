import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import { calculateVirtualPrice } from "@saberhq/stableswap-sdk";
import { Percent, ZERO } from "@saberhq/token-utils";
import JSBI from "jsbi";

import { calculateLPTokenAmount } from "../calculateLPTokenAmount";

// https://github.com/harmony-one/dapp-curve-ui/blob/master/common.js#L224
export const calculateDepositSlippage = (
  exchange: IExchangeInfo,
  amountA: JSBI,
  amountB: JSBI,
): Percent => {
  const constantSum = JSBI.add(amountA, amountB); // Sr
  if (JSBI.equal(constantSum, ZERO)) {
    return new Percent(0);
  }
  const tokenAmount = calculateLPTokenAmount(exchange, amountA, amountB, true);
  // pool token virtual price
  const virtualPrice = calculateVirtualPrice(exchange);
  if (!virtualPrice) {
    return new Percent(0);
  }

  return new Percent(1).subtract(
    new Percent(virtualPrice.multiply(tokenAmount).quotient, constantSum),
  );
};
