import { useUserATAs } from "@saberhq/sail";
import type { TokenAmount } from "@saberhq/token-utils";
import { Fraction, Percent } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import { useMemo } from "react";

import { formatPercent } from "../format";
import { useStableSwap } from "../useStableSwap";

export const useUserPoolShare = (): {
  /**
   * The total value of all of the user's tokens, assuming peg is met.
   */
  shareValue?: Fraction;
  shareValueUSD?: Fraction;
  lpTokenBalance?: TokenAmount;
  total?: Fraction;
  userSharePercent?: Percent;
} => {
  const wallet = useConnectedWallet();
  const { exchange, exchangeInfo, virtualPrice, currencyPriceUSD } =
    useStableSwap();
  const [poolTokenAccount] = useUserATAs(exchange?.lpToken);

  const userSharePercent =
    poolTokenAccount && exchangeInfo
      ? new Percent(
          poolTokenAccount.balance.raw,
          exchangeInfo.lpTotalSupply.raw,
        )
      : wallet
        ? new Percent(0, 1)
        : undefined;

  const total = exchangeInfo
    ? exchangeInfo.reserves
        .map((r) => r.amount.asFraction)
        .reduce((acc, el) => acc.add(el))
    : undefined;

  const lpTokenBalance = poolTokenAccount?.balance;

  const shareValue = useMemo(
    () =>
      lpTokenBalance && virtualPrice
        ? lpTokenBalance.multiply(virtualPrice)
        : wallet
          ? new Fraction(0, 1)
          : undefined,
    [lpTokenBalance, virtualPrice, wallet],
  );

  const shareValueUSD = useMemo(() => {
    if (!shareValue || !currencyPriceUSD) {
      return undefined;
    }
    return shareValue.multiply(Fraction.fromNumber(currencyPriceUSD));
  }, [currencyPriceUSD, shareValue]);

  return { shareValue, shareValueUSD, lpTokenBalance, total, userSharePercent };
};

export const formatSharePercent = (percent?: Percent): string =>
  percent === undefined
    ? "--%"
    : percent.greaterThan(0) && percent.lessThan(new Fraction(1, 10000))
      ? "<0.01%"
      : formatPercent(percent);
