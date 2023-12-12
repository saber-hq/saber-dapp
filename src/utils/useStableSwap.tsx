import { Pair } from "@saberhq/saber-periphery";
import { useSail } from "@saberhq/sail";
import type { IExchangeInfo, StableSwap } from "@saberhq/stableswap-sdk";
import type { Fraction, Price } from "@saberhq/token-utils";
import { useCallback, useMemo } from "react";
import { createContainer } from "unstated-next";

import { usePrice } from "../contexts/prices";
import { useRouter } from "../contexts/router";
import { CurrencyMarket, getMarket } from "./currencies";
import { notify } from "./notifications";
import type { Pool } from "./useEnvironment";

interface IUseStableSwap {
  swap?: StableSwap;
  exchange?: Pool;
  exchangeInfo?: IExchangeInfo;
  refreshSwapState: () => Promise<StableSwap | null>;

  /**
   * Currency of the LP token.
   */
  currency: CurrencyMarket;
  /**
   * Price of 1 LP token, assuming tokens have value = 1.
   */
  virtualPrice?: Fraction;
  /**
   * Price of token 1 in terms of token 0.
   */
  unitPrice?: Price;
  /**
   * Price of the currency in USD
   */
  currencyPriceUSD: number | null | undefined;
}

type UseStableSwapArgs = { exchange?: Pool };

const useStableSwapInternal = ({
  exchange,
}: UseStableSwapArgs = {}): IUseStableSwap => {
  const { refetch } = useSail();
  const { exchangeMap, getExchangeInfo } = useRouter();
  const exchangeInfo = useMemo(
    () => (exchange ? getExchangeInfo(exchange) : null),
    [exchange, getExchangeInfo],
  );

  const swap = exchangeInfo?.swap;

  const refreshSwapState = useCallback(async () => {
    if (!exchange) {
      return null;
    }
    try {
      await refetch(exchange.swapAccount);
      return exchangeMap[exchange.lpToken.address]?.swap ?? null;
    } catch (e) {
      notify({ message: `Error loading swap: ${(e as Error).message}` });
      return null;
    }
  }, [exchange, refetch, exchangeMap]);

  const currency =
    exchange?.tokens.map((tok) => getMarket(tok))[0] ?? CurrencyMarket.USD;

  const currencyPriceUSD = usePrice(currency);

  const unitPrice = useMemo(
    () =>
      swap && exchangeInfo
        ? Pair.fromStableSwap({
            config: swap.config,
            state: swap.state,
            exchange: exchangeInfo.info,
          }).token1Price
        : undefined,
    [swap, exchangeInfo],
  );

  return {
    refreshSwapState,
    swap: swap ?? undefined,
    exchange,
    exchangeInfo: exchangeInfo?.info,
    currency,
    virtualPrice: exchangeInfo?.virtualPrice ?? undefined,
    unitPrice,
    currencyPriceUSD,
  };
};

export const { Provider: StableSwapProvider, useContainer: useStableSwap } =
  createContainer(useStableSwapInternal);
