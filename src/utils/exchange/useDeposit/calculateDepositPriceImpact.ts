import type { IExchangeInfo } from "@saberhq/stableswap-sdk";
import { calculateEstimatedMintAmount } from "@saberhq/stableswap-sdk";
import type { Fraction } from "@saberhq/token-utils";
import { Percent, TokenAmount, ZERO } from "@saberhq/token-utils";
import JSBI from "jsbi";

const calculatePricePerLPToken = (exchange: IExchangeInfo): Fraction => {
  return exchange.reserves[0].amount.asFraction
    .add(exchange.reserves[1].amount.asFraction)
    .divide(exchange.lpTotalSupply.asFraction);
};

/**
 * This is calculated as the change in the price of the LP token after a deposit.
 * @param exchange
 * @param amountA
 * @param amountB
 * @returns
 */
export const calculateDepositPriceImpact = (
  exchange: IExchangeInfo,
  amountA: JSBI,
  amountB: JSBI,
): Percent => {
  const constantSum = JSBI.add(amountA, amountB); // Sr
  if (JSBI.equal(constantSum, ZERO)) {
    return new Percent(0);
  }

  const { mintAmount } = calculateEstimatedMintAmount(
    exchange,
    amountA,
    amountB,
  );

  const newLpTotalSupply = exchange.lpTotalSupply.add(
    new TokenAmount(exchange.lpTotalSupply.token, mintAmount.raw),
  );
  const exchangeAfterDeposit = {
    ...exchange,
    lpTotalSupply: newLpTotalSupply,
    reserves: [
      {
        ...exchange.reserves[0],
        amount: new TokenAmount(
          exchange.reserves[0].amount.token,
          JSBI.add(exchange.reserves[0].amount.raw, amountA),
        ),
      },
      {
        ...exchange.reserves[1],
        amount: new TokenAmount(
          exchange.reserves[1].amount.token,
          JSBI.add(exchange.reserves[1].amount.raw, amountB),
        ),
      },
    ] as const,
  };

  // pool token price change
  const lpPrice0 = calculatePricePerLPToken(exchange);
  const lpPrice1 = calculatePricePerLPToken(exchangeAfterDeposit);
  if (!lpPrice0 || !lpPrice1) {
    return new Percent(0);
  }

  const fraction = lpPrice1
    .subtract(lpPrice0)
    .divide(lpPrice0.add(lpPrice1).divide(2));
  const percent = new Percent(fraction.numerator, fraction.denominator);
  if (percent.lessThan(0)) {
    return percent.multiply(-1);
  }
  return percent;
};
