import type { IWithdrawOneResult } from "@saberhq/stableswap-sdk";
import { Fraction, TokenAmount } from "@saberhq/token-utils";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";

import { IWithdrawalMode, useSettings } from "../../../../contexts/settings";
import type { IUseWithdraw } from "../../../../utils/exchange/useWithdraw";
import { useWithdraw } from "../../../../utils/exchange/useWithdraw";
import { useStableSwap } from "../../../../utils/useStableSwap";
import { useStableSwapTokens } from "../../../../utils/useStableSwapTokens";
import { useMaxWithdrawOneAmount } from "./useMaxWithdrawOneAmount";
import type { WrappedToken } from "./wrappedToken";

export interface WithdrawState {
  estimates: [TokenAmount | undefined, TokenAmount | undefined];
  withdraw: IUseWithdraw;
  wrappedTokens: WrappedToken[];
  maxWithdrawAmounts: (IWithdrawOneResult | undefined)[];

  withdrawPercentage: string;
  setWithdrawPercentage: (pct: string) => void;
  withdrawToken?: WrappedToken;
  setWithdrawToken: (tok: WrappedToken) => void;
}

export const useWithdrawState = (): WithdrawState => {
  const { exchange } = useStableSwap();
  const { tokens, underlyingTokens, poolTokenAccount, wrappedTokens } =
    useStableSwapTokens();

  const [withdrawPercentage, setWithdrawPercentage] =
    useState<string>("100.00");

  // token to display
  const [withdrawToken, setWithdrawToken] = useState<WrappedToken | undefined>(
    wrappedTokens[0],
  );

  const withdrawPoolTokenAmount: TokenAmount | undefined = useMemo(() => {
    try {
      if (exchange?.lpToken && poolTokenAccount) {
        const fraction = new Fraction(
          (parseFloat(withdrawPercentage) / 100) * 1_000_000,
          1_000_000,
        );
        return new TokenAmount(
          exchange.lpToken,
          fraction.multiply(poolTokenAccount.balance.raw).toFixed(0),
        );
      }
    } catch (e) {
      return undefined;
    }
  }, [exchange?.lpToken, poolTokenAccount, withdrawPercentage]);

  const withdraw = useWithdraw({
    withdrawPoolTokenAmount,
    withdrawToken,
    wrappedTokens,
  });

  const { withdrawalMode } = useSettings();
  useEffect(() => {
    if (withdrawalMode === IWithdrawalMode.ALL && withdrawToken !== undefined) {
      setWithdrawToken(undefined);
    } else if (
      withdrawalMode === IWithdrawalMode.ONE &&
      withdrawToken === undefined
    ) {
      const defaultToken = wrappedTokens?.[0];
      invariant(defaultToken, "default token");
      setWithdrawToken(defaultToken);
    }
  }, [tokens, underlyingTokens, withdrawToken, withdrawalMode, wrappedTokens]);

  const estimates = useMemo(() => {
    const poolTokenBalance = poolTokenAccount?.balance;
    if (!poolTokenBalance || poolTokenBalance.isZero()) {
      return [undefined, undefined];
    }

    return withdraw.estimates;
  }, [withdraw.estimates, poolTokenAccount?.balance]) as [
    TokenAmount | undefined,
    TokenAmount | undefined,
  ];

  const [wTokenA, wTokenB] = wrappedTokens;
  const maxWithdrawAmounts = [
    useMaxWithdrawOneAmount(wTokenA),
    useMaxWithdrawOneAmount(wTokenB),
  ];

  return {
    wrappedTokens,
    estimates,
    withdraw,
    maxWithdrawAmounts,

    withdrawPercentage,
    setWithdrawPercentage,
    withdrawToken,
    setWithdrawToken,
  };
};
