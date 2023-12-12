import { useUserATAs } from "@saberhq/sail";
import type { Token, TokenAmount } from "@saberhq/token-utils";
import { Fraction } from "@saberhq/token-utils";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import { Tags } from "../utils/builtinTokens";
import { CurrencyMarket, getMarketIfExists } from "../utils/currencies";
import { useEnvironment } from "../utils/useEnvironment";
import { useSettings } from "./settings";

const isNotDust = (amount: TokenAmount): boolean => {
  const { token } = amount;
  const market = getMarketIfExists(token);
  if (market === CurrencyMarket.USD) {
    // USD threshold: 1 cent
    return amount.greaterThan(new Fraction(1, 100));
  }
  if (market === CurrencyMarket.BTC) {
    // BTC threshold: 100 sats
    return amount.greaterThan(new Fraction(100, 100_000_000));
  }
  return amount.greaterThan(0);
};

const useSwappableTokensInternal = (): {
  swappableTokens: readonly Token[];
} => {
  const { tokens } = useEnvironment();
  const userTokenAccounts = useUserATAs(...tokens);
  const { includeWrapped } = useSettings();
  const swappableTokens = useMemo(
    () =>
      tokens
        .filter((t) => {
          if (t.info.tags?.includes(Tags.Hidden)) {
            return false;
          }
          if (t.info.tags?.includes(Tags.StableSwapLP)) {
            return false;
          }
          if (t.info.tags?.includes(Tags.DecimalWrapped)) {
            if (includeWrapped) {
              return true;
            }
            const balance = userTokenAccounts.find(
              (account) => account?.balance.token.equals(t),
            )?.balance;
            if (t.address === "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT") {
              // XXX(michael): CASH pools are paused.
              return false;
            }

            return balance && isNotDust(balance);
          }
          return true;
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [includeWrapped, tokens, userTokenAccounts],
  );
  return { swappableTokens };
};

export const {
  useContainer: useSwappableTokens,
  Provider: SwappableTokensProvider,
} = createContainer(useSwappableTokensInternal);
