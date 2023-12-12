import type { Network } from "@saberhq/solana-contrib";
import type { IExchange } from "@saberhq/stableswap-sdk";
import { SWAP_PROGRAM_ID } from "@saberhq/stableswap-sdk";
import type { ChainId } from "@saberhq/token-utils";
import { ENV, networkToChainId, Token } from "@saberhq/token-utils";
import { useConnectionContext } from "@saberhq/use-solana";
import * as Sentry from "@sentry/react";
import { keyBy, pickBy } from "lodash-es";
import { useEffect, useMemo } from "react";
import { createContainer } from "unstated-next";

import { useConfig } from "../contexts/config";
import type {
  DetailedSwapSummary,
  PoolInfo,
  PoolsInfoData,
} from "./api/usePoolsInfo";
import { usePoolsInfo } from "./api/usePoolsInfo";
import { useTokenList } from "./api/useTokenList";
import type { CurrencyMarket } from "./currencies";
import { getMarketIfExists } from "./currencies";
import type { IEnvironment } from "./environments";
import { TokenGroups } from "./tokenGroups";

export interface Pool extends IExchange, Partial<Pick<PoolInfo, "swap">> {
  id: string;
  name: string;
  currency: CurrencyMarket;
  /**
   * Icons per token, underlying
   */
  underlyingIcons: readonly [Token, Token];
  hidden?: boolean;
}

export interface KnownPool
  extends IExchange,
    Omit<PoolInfo, "tokens" | "tokenIcons" | "lpToken">,
    Omit<DetailedSwapSummary, "id"> {
  /**
   * Tokens of the pool
   */
  tokens: readonly [Token, Token];
  /**
   * Underlying tokens
   */
  underlyingIcons: readonly [Token, Token];
}

export const envs = {
  "mainnet-beta": ENV.MainnetBeta,
  devnet: ENV.Devnet,
  testnet: ENV.Testnet,
} as const;

interface UseEnvironment {
  loading: boolean;
  name: string;
  endpoint: string;

  pools: Record<string, KnownPool>;

  tokens: readonly Token[];

  tokenGroups: TokenGroups;
  tokenMap: Record<string, Token> | null;
  chainId: ChainId | null;
  environments: { [N in Network]: IEnvironment };

  addresses?: PoolsInfoData["addresses"] | null;
}

const useEnvironmentInternal = (): UseEnvironment => {
  const { network } = useConnectionContext();
  useEffect(() => {
    Sentry.setContext("network", {
      network,
    });
  }, [network]);

  const { data: tokenListResponse } = useTokenList();
  const tokenList = tokenListResponse?.tokens;
  const { data: poolsInfoResponse } = usePoolsInfo();
  const poolsInfo = poolsInfoResponse?.pools;

  const { environments } = useConfig();
  const environment: IEnvironment = environments[network];
  const chainId: ChainId = useMemo(() => networkToChainId(network), [network]);

  const tokens: Token[] = useMemo(() => {
    if (!tokenList) {
      return [];
    }
    return tokenList
      .filter((t) => t.chainId === (chainId as number))
      .map((t) => new Token(t));
  }, [chainId, tokenList]);
  const tokenMap: Record<string, Token> | null = useMemo(() => {
    if (!chainId) {
      return null;
    }
    const nextTokenMap: Record<string, Token> = {};
    tokens.forEach((token) => {
      if (token.chainId !== (chainId as number)) {
        return;
      }
      nextTokenMap[token.address] = token;
    });
    return nextTokenMap;
  }, [chainId, tokens]);

  const pools = useMemo(() => {
    const result =
      poolsInfo?.map((pool): KnownPool => {
        const {
          summary: { id: _id, ...summary },
        } = pool;
        return {
          ...pool,
          ...summary,
          swapAccount: pool.swap.config.swapAccount,
          programID: SWAP_PROGRAM_ID,
          tokens: pool.tokens.map(
            (token) => new Token(token),
          ) as unknown as readonly [Token, Token],
          underlyingIcons: pool.underlyingIcons.map(
            (token) => new Token(token),
          ) as unknown as readonly [Token, Token],
          lpToken: new Token(pool.lpToken),
        };
      }) ?? [];
    return keyBy(
      pickBy(result, (x): x is KnownPool => !!x),
      (p) => p.id,
    );
  }, [poolsInfo]);

  const tokenGroups = useMemo(() => {
    const nextTokenGroups = new TokenGroups();
    tokens.forEach((token) => {
      const market = getMarketIfExists(token);
      if (market) {
        nextTokenGroups.add(market, token);
      }
    });
    return nextTokenGroups;
  }, [tokens]);

  return {
    loading: false,
    name: environment.name,
    endpoint: environment.endpoint,
    pools,

    tokens,

    tokenGroups,
    tokenMap,
    chainId,
    environments,

    addresses: poolsInfoResponse?.addresses,
  };
};

export const { Provider: EnvironmentProvider, useContainer: useEnvironment } =
  createContainer(useEnvironmentInternal);
