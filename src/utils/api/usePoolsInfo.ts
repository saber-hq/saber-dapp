import { fetchNullableWithSessionCache } from "@saberhq/sail";
import { formatNetwork } from "@saberhq/solana-contrib";
import type {
  StableSwapConfig,
  StableSwapState,
  SwapTokenInfo,
} from "@saberhq/stableswap-sdk";
import type { TokenInfo } from "@saberhq/token-utils";
import { Percent, u64 } from "@saberhq/token-utils";
import { useSolana } from "@saberhq/use-solana";
import { PublicKey } from "@solana/web3.js";
import { mapValues } from "lodash-es";
import { useQuery } from "react-query";

import type { CurrencyMarket } from "../currencies";

export const POOL_TAGS = {
  "wormhole-v1": "Contains a Wormhole V1 asset.",
  "wormhole-v2": "Contains a Wormhole V2 asset.",
};
export type PoolTag = keyof typeof POOL_TAGS;

/**
 * Use pools info from the API.
 * @returns
 */
export const usePoolsInfo = () => {
  const { network } = useSolana();
  return useQuery(["registryPoolsInfo", network], async () => {
    const swaps = await fetchNullableWithSessionCache<
      readonly DetailedSwapSummary[]
    >(
      `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/swaps.${formatNetwork(
        network,
      )}.json`,
    );
    if (!swaps) {
      return swaps;
    }
    const data = await fetchNullableWithSessionCache<{
      addresses: {
        landlord: string;
        landlordBase: string;
      };
      pools: readonly PoolInfoRaw[];
    }>(
      `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/pools-info.${formatNetwork(
        network,
      )}.json`,
    );
    if (!data) {
      return data;
    }
    return {
      addresses: valuesToKeys(data.addresses),
      pools: data.pools.map((poolRaw: unknown) => {
        const pool = poolRaw as PoolInfoRaw;
        const swap: DetailedSwapSummary | null =
          (swaps.find(
            (s: DetailedSwapSummary) => s.id === pool.id,
          ) as DetailedSwapSummary) ?? null;
        if (!swap) {
          throw new Error(`swap not found`);
        }
        return {
          ...pool,
          summary: swap,
          swap: {
            config: valuesToKeys(pool.swap.config),
            state: parseRawSwapState(pool.swap.state),
          },
        };
      }),
    };
  });
};

export const useSwaps = () => {
  const { network } = useSolana();
  return useQuery(["registrySwaps", network], async () => {
    return await fetchNullableWithSessionCache<readonly DetailedSwapSummary[]>(
      `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/swaps.${formatNetwork(
        network,
      )}.json`,
    );
  });
};

/**
 * Summary of a swap, coming directly from the chain.
 */
export interface SwapSummary {
  /**
   * Addresses of the tokens that back the pool.
   */
  underlyingTokens: readonly [string, string];
  /**
   * Number of decimals this pool's LP token has.
   */
  decimals: number;

  /**
   * Useful addresses to know about the pool.
   */
  addresses: {
    /**
     * The swap account.
     */
    swapAccount: string;
    /**
     * The swap authority.
     */
    swapAuthority: string;
    /**
     * Mint of the LP token.
     */
    lpTokenMint: string;
    /**
     * Token accounts holding the reserves of the LP.
     */
    reserves: readonly [string, string];
    /**
     * The key of the pool's quarry corresponding to the Saber rewarder.
     */
    quarry: string;
    /**
     * The key of the pool's Quarry merge pool.
     */
    mergePool: string;
    /**
     * The pool's admin.
     */
    admin: string;
  };
}

/**
 * Summary of a specific Swap.
 */
export interface DetailedSwapSummary extends SwapSummary {
  /**
   * Unique slug of the pool.
   */
  id: string;
  /**
   * Name of the pool.
   */
  name: string;
  /**
   * The currency of this pool.
   */
  currency: CurrencyMarket;

  /**
   * Addresses of the tokens to be displayed as the pool's underlying tokens.
   * This is also used to derive the pool's name, symbol, and icon.
   */
  displayTokens: readonly [string, string];
  /**
   * Sources of the pool tokens, if applicable.
   */
  sources?: string[];

  /**
   * Tags applicable to the pool.
   */
  tags?: readonly PoolTag[];

  /**
   * If a pool is being migrated, this is the ID of the new pool.
   */
  newPoolID?: string;
  /**
   * More information about when the pool was launched.
   */
  launchPost?: string;

  /**
   * If true, then this pool is verified and should be displayed on the pools list.
   * In other words, the pool ID must exist.
   *
   * One should only route and display verified pools.
   */
  isVerified: boolean;
}

export interface PoolInfo {
  id: string;
  name: string;
  tokens: readonly [TokenInfo, TokenInfo];
  tokenIcons: readonly [TokenInfo, TokenInfo];
  underlyingIcons: readonly [TokenInfo, TokenInfo];
  currency: CurrencyMarket;
  lpToken: TokenInfo;

  swap: {
    config: StableSwapConfig;
    state: StableSwapState;
  };
  newPoolID?: string;

  /**
   * Optional info on why the pool is deprecated.
   */
  deprecationInfo?: {
    /**
     * The pool that users should migrate their assets to.
     */
    newPoolID?: string;
    /**
     * Message showing why the pool is deprecated.
     */
    message?: string;
    /**
     * Link to more information.
     */
    link?: string;
  };
  tags?: readonly PoolTag[];
  summary: DetailedSwapSummary;
}

export interface PoolsInfoData {
  addresses: {
    landlord: PublicKey;
    landlordBase: PublicKey;
  };
  pools: PoolInfo[];
}

type PoolInfoRaw = Omit<PoolInfo, "swap"> & {
  swap: {
    config: {
      swapAccount: string;
      authority: string;
      swapProgramID: string;
      tokenProgramID: string;
    };
    state: StableSwapStateRaw;
  };
  hidden?: boolean;
};

type SwapTokenInfoRaw = {
  [K in keyof SwapTokenInfo]: string;
};

type StableSwapStateRaw = {
  [K in keyof StableSwapState]: StableSwapState[K] extends PublicKey | u64
    ? string
    : StableSwapState[K] extends SwapTokenInfo
      ? SwapTokenInfoRaw
      : StableSwapState[K];
};

const parseRawSwapState = (state: StableSwapStateRaw): StableSwapState => {
  return {
    isInitialized: state.isInitialized,
    isPaused: state.isPaused,
    nonce: state.nonce,

    futureAdminDeadline: state.futureAdminDeadline,
    futureAdminAccount: new PublicKey(state.futureAdminAccount),
    poolTokenMint: new PublicKey(state.poolTokenMint),
    adminAccount: new PublicKey(state.adminAccount),

    tokenA: valuesToKeys(state.tokenA),
    tokenB: valuesToKeys(state.tokenB),

    initialAmpFactor: new u64(state.initialAmpFactor, "hex"),
    targetAmpFactor: new u64(state.targetAmpFactor, "hex"),
    startRampTimestamp: state.startRampTimestamp,
    stopRampTimestamp: state.stopRampTimestamp,

    fees: {
      trade: new Percent(
        state.fees.trade.numerator ?? state.fees.trade.numeratorStr,
        state.fees.trade.denominator ?? state.fees.trade.denominatorStr,
      ),
      adminTrade: new Percent(
        state.fees.adminTrade.numerator ?? state.fees.adminTrade.numeratorStr,
        state.fees.adminTrade.denominator ??
          state.fees.adminTrade.denominatorStr,
      ),
      withdraw: new Percent(
        state.fees.withdraw.numerator ?? state.fees.withdraw.numeratorStr,
        state.fees.withdraw.denominator ?? state.fees.withdraw.denominatorStr,
      ),
      adminWithdraw: new Percent(
        state.fees.adminWithdraw.numerator ??
          state.fees.adminWithdraw.numeratorStr,
        state.fees.adminWithdraw.denominator ??
          state.fees.adminWithdraw.denominatorStr,
      ),
    },
  };
};

const valuesToKeys = <T extends Record<string, string>>(
  raw: T,
): { [K in keyof T]: PublicKey } =>
  mapValues(raw, (addr) => new PublicKey(addr));
