import { Pair } from "@saberhq/saber-periphery";
import type { ProgramAccountParser } from "@saberhq/sail";
import {
  useBatchedParsedAccounts,
  useBatchedTokenAccounts,
  useBatchedTokenMints,
  usePubkeysMemo,
} from "@saberhq/sail";
import type { IExchangeInfo, StableSwapState } from "@saberhq/stableswap-sdk";
import {
  calculateAmpFactor,
  calculateVirtualPrice,
  decodeSwap,
  StableSwap,
  SWAP_PROGRAM_ID,
} from "@saberhq/stableswap-sdk";
import { TOKEN_PROGRAM_ID, TokenAmount } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import { chunk, zip } from "lodash-es";
import { useMemo } from "react";
import invariant from "tiny-invariant";

import type { ExchangeInfo, ExchangeMap } from "../../contexts/router";
import { useEnvironment } from "../useEnvironment";

interface AllPools {
  loading: boolean;
  poolsMap: ExchangeMap;
  exchanges: ExchangeInfo[];
}

export const swapParser: ProgramAccountParser<StableSwapState> = {
  programID: SWAP_PROGRAM_ID,
  name: "SwapInfo",
  parse: decodeSwap,
};

/**
 * Loads all pools in the environment.
 * @returns
 */
export const useAllPools = (): AllPools => {
  const { pools } = useEnvironment();
  const poolsList = useMemo(() => Object.values(pools), [pools]);
  const swapAccountKeys = useMemo(
    () => poolsList.map((pool) => pool.swapAccount),
    [poolsList],
  );

  const { data: swapDatas, isLoading: isSwapDataLoading } =
    useBatchedParsedAccounts(swapAccountKeys, swapParser, {
      // we won't have to change the pools very often
      staleTime: 600 * 1_000,
    });

  const swaps = useMemo(() => {
    if (!swapDatas) {
      return [];
    }
    return zip(
      swapDatas,
      poolsList.map((pool) => new PublicKey(pool.addresses.swapAuthority)),
    ).map(([swapData, authority]) => {
      if (!swapData) {
        return swapData;
      }
      invariant(authority);
      return new StableSwap(
        {
          swapAccount: swapData.publicKey,
          swapProgramID: SWAP_PROGRAM_ID,
          tokenProgramID: TOKEN_PROGRAM_ID,
          authority,
        },
        swapData.account,
      );
    });
  }, [poolsList, swapDatas]);

  const { data: poolMints, isLoading: poolMintsLoading } = useBatchedTokenMints(
    usePubkeysMemo(
      useMemo(() => swaps.map((swap) => swap?.state.poolTokenMint), [swaps]),
    ),
  );

  const { data: allPoolReserves, isLoading: allPoolReservesLoading } =
    useBatchedTokenAccounts(
      usePubkeysMemo(
        useMemo(
          () =>
            swaps.flatMap((swap) => [
              swap?.state.tokenA.reserve,
              swap?.state.tokenB.reserve,
            ]),
          [swaps],
        ),
      ),
    );

  const exchanges: ExchangeInfo[] = useMemo(() => {
    if (!poolMints || !allPoolReserves) {
      return [];
    }
    return zip(swaps, poolsList, poolMints, chunk(allPoolReserves, 2))
      .map(([swap, pool, poolMint, poolReserves]): ExchangeInfo | null => {
        if (!pool || !swap || !poolMint || !poolReserves) {
          return null;
        }
        const [tokenAReserve, tokenBReserve] = poolReserves;
        if (!tokenAReserve || !tokenBReserve) {
          return null;
        }

        const ampFactor = calculateAmpFactor(swap.state);
        const exchangeInfo: IExchangeInfo = {
          ampFactor,
          fees: swap.state.fees,
          lpTotalSupply: new TokenAmount(
            pool.lpToken,
            poolMint.account.supply ?? 0,
          ),
          reserves: [
            {
              reserveAccount: swap.state.tokenA.reserve,
              adminFeeAccount: swap.state.tokenA.adminFeeAccount,
              amount: new TokenAmount(
                pool.tokens[0],
                tokenAReserve.account.amount,
              ),
            },
            {
              reserveAccount: swap.state.tokenB.reserve,
              adminFeeAccount: swap.state.tokenB.adminFeeAccount,
              amount: new TokenAmount(
                pool.tokens[1],
                tokenBReserve.account.amount,
              ),
            },
          ],
        };

        const virtualPrice = calculateVirtualPrice(exchangeInfo);
        const pair = Pair.fromStableSwap({
          config: swap.config,
          state: swap.state,
          exchange: exchangeInfo,
        });

        return {
          exchange: pool,
          swap,
          info: exchangeInfo,
          virtualPrice,
          pair,
        };
      })
      .filter((x): x is ExchangeInfo => x !== null);
  }, [allPoolReserves, poolMints, poolsList, swaps]);

  const poolsMap: ExchangeMap = useMemo(() => {
    const ret: ExchangeMap = {};
    exchanges.forEach((x) => {
      if (!x) {
        return;
      }
      ret[x.exchange.lpToken.address] = x;
    });
    return ret;
  }, [exchanges]);

  const loading =
    poolMintsLoading || allPoolReservesLoading || isSwapDataLoading;
  return { exchanges, poolsMap, loading };
};
