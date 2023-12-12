import type { AnyPair } from "@saberhq/saber-periphery";
import {
  Pair,
  Saber,
  SABER_ADDRESSES,
  Trade,
  WrappedToken,
} from "@saberhq/saber-periphery";
import type { StableSwapPool } from "@saberhq/saber-periphery/dist/cjs/router/entities/pair/stableSwap";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type {
  IExchange,
  IExchangeInfo,
  StableSwap,
} from "@saberhq/stableswap-sdk";
import type { Fraction, Token, TokenAmount } from "@saberhq/token-utils";
import { useConnectionContext } from "@saberhq/use-solana";
import * as Sentry from "@sentry/react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { partition } from "lodash-es";
import { useCallback, useMemo } from "react";
import { useQueries } from "react-query";
import invariant from "tiny-invariant";
import { createContainer } from "unstated-next";

import { Tags } from "../utils/builtinTokens";
import { useAllPools } from "../utils/exchange/useAllPools";
import type { Pool } from "../utils/useEnvironment";
import { useEnvironment } from "../utils/useEnvironment";
import { createEphemeralWrappedSolAccount } from "../utils/wrappedSol";
import { useSettings } from "./settings";

interface ExecuteTradeArgs {
  saber: Saber;
  trade: Trade;
}

const EMPTY: unknown[] = [];

export type ExchangeMap = { [lpToken: string]: ExchangeInfo };

interface Router {
  loading: boolean;
  getTrades: (
    inputAmount: TokenAmount,
    output: Token,
    maxHops?: number,
  ) => Trade[];
  executeTrade: (args: ExecuteTradeArgs) => Promise<{
    initTX: TransactionEnvelope;
    tradeTX: TransactionEnvelope;
    exchanges: IExchange[];
  }>;
  exchangeMap: ExchangeMap;
  getExchangeInfo: (exchange: IExchange) => ExchangeInfo | null;
}

export interface ExchangeInfo {
  exchange: IExchange & Pool;
  swap: StableSwap;
  info: IExchangeInfo;
  virtualPrice: Fraction | null;
  pair: Pair<StableSwapPool>;
}

const useRouterInternal = (): Router => {
  const { network } = useConnectionContext();
  const { tokens } = useEnvironment();
  const { poolsMap, exchanges, loading } = useAllPools();
  const exchangeMap = poolsMap;

  const wrappedPairs = useQueries(
    useMemo(
      () =>
        tokens
          .filter(
            (tok) =>
              tok.info.extensions?.assetContract &&
              tok.info.tags?.includes(Tags.DecimalWrapped),
          )
          .map((tok) => {
            return {
              queryKey: ["wrapperToken", tok.network, tok.address],
              queryFn: async () => {
                const underlyingMint = tok.info.extensions?.assetContract;
                invariant(underlyingMint, "underlying missing");
                const underlying = tokens.find(
                  (tok) => tok.address === underlyingMint,
                );
                invariant(underlying, "underlying not in token list");
                const [wrapperAddress] = await WrappedToken.getAddressAndNonce(
                  new PublicKey(SABER_ADDRESSES.AddDecimals),
                  underlying.mintAccount,
                  tok.decimals,
                );
                const wt = new WrappedToken(
                  underlying,
                  wrapperAddress,
                  tok.mintAccount,
                  tok.decimals,
                );
                return Pair.fromWrappedToken(wt);
              },
              staleTime: Infinity,
            };
          }),
      [tokens],
    ),
  );

  const exchangePairs = useMemo(
    () =>
      exchanges
        .filter(
          (x) => x.exchange.id !== "ibbtc" && !x.exchange.name.includes("CASH"),
        )
        .map((x) => x.pair),
    [exchanges],
  );
  const wrappedPairsMemo = useMemo(
    () =>
      wrappedPairs.every((wp) => wp.data !== undefined)
        ? wrappedPairs.map((wp) => wp.data)
        : (EMPTY as Pair<WrappedToken>[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(wrappedPairs.map((p) => p.data?.pool.address) ?? [])],
  );

  const pairs = useMemo(() => {
    return [...exchangePairs, ...wrappedPairsMemo];
  }, [exchangePairs, wrappedPairsMemo]);

  const getTrades = useCallback(
    (inputAmount: TokenAmount, output: Token, maxHops?: number): Trade[] => {
      if (pairs.length === 0) {
        return [];
      }
      if (inputAmount.token.network !== network) {
        console.debug(
          `Input token has network ${inputAmount.token.network} but we are on ${network}. No trades will be returned.`,
        );
        return [];
      }
      if (output.network !== network) {
        console.debug(
          `Output token has network ${output.network} but we are on ${network}. No trades will be returned.`,
        );
        return [];
      }
      try {
        return Trade.bestTradeExactIn(pairs as AnyPair[], inputAmount, output, {
          maxHops: maxHops ?? 4,
        });
      } catch (e) {
        // for some reason we end up in a weird state where an invalid trade
        // is computed. Let's ignore this for now but log to Sentry...
        Sentry.captureException(e, {
          tags: {
            action: "bestTradeExactIn",
          },
        });
        return [];
      }
    },
    [network, pairs],
  );

  const { maxSlippagePercent } = useSettings();
  const executeTrade = useCallback(
    async ({
      saber,
      trade,
    }: ExecuteTradeArgs): Promise<{
      initTX: TransactionEnvelope;
      tradeTX: TransactionEnvelope;
      exchanges: IExchange[];
    }> => {
      const { route } = trade;

      // swap many
      const exchanges = route.pairs
        .filter((p) => p.isStableSwapPair())
        .map((thePair) => {
          const pair = thePair as Pair<StableSwapPool>;
          const exchange =
            exchangeMap[pair.pool.state.poolTokenMint.toString()];
          invariant(exchange, "EXCHANGE");
          return exchange;
        });

      let tx: TransactionEnvelope;
      if (trade.inputAmount.token.mintAccount.equals(NATIVE_MINT)) {
        // Create an ephemeral account for wrapped SOL
        const ephemeralAccount = Keypair.generate();
        const { init, close } = await createEphemeralWrappedSolAccount({
          provider: saber.provider,
          amount: trade.inputAmount,
          accountKP: ephemeralAccount,
        });

        const routerSDK = Saber.load({ provider: saber.provider });
        const tradeTX: TransactionEnvelope = await routerSDK.router
          .planTrade(trade, trade.minimumAmountOut(maxSlippagePercent))
          .buildTXWithEphemeralInput(ephemeralAccount.publicKey);
        tx = init.combine(tradeTX).combine(close);
      } else {
        const routerSDK = Saber.load({ provider: saber.provider });
        tx = await routerSDK.router
          .planTrade(trade, trade.minimumAmountOut(maxSlippagePercent))
          .buildTX();
      }

      const [initIXs, tradeIXs] = partition(tx.instructions, (ix) =>
        ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID),
      );

      const initTX = new TransactionEnvelope(tx.provider, initIXs);
      const tradeTX = new TransactionEnvelope(
        tx.provider,
        tradeIXs,
        tx.signers,
      );

      return {
        initTX,
        tradeTX,
        exchanges: exchanges.map((x) => x.exchange),
      };
    },
    [exchangeMap, maxSlippagePercent],
  );

  const getExchangeInfo = useCallback(
    (exchange: IExchange): ExchangeInfo | null => {
      const exchangeConfig = exchange
        ? exchangeMap[exchange.lpToken.address]
        : null;
      return exchangeConfig ?? null;
    },
    [exchangeMap],
  );

  return {
    loading,
    getTrades,
    executeTrade,
    exchangeMap,
    getExchangeInfo,
  };
};

export const { useContainer: useRouter, Provider: RouterProvider } =
  createContainer(useRouterInternal);
