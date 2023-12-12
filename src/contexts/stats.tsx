import type { TokenInfo } from "@saberhq/token-utils";
import type { DocumentNode } from "graphql";
import { request } from "graphql-request";
import gql from "graphql-tag";
import { useQuery } from "react-query";

const STATS_QUERY: DocumentNode = gql`
  query AllPoolStats {
    pools {
      ammId
      name
      coin {
        chainId
        address
        name
        decimals
        symbol
        logoURI
      }
      pc {
        chainId
        address
        name
        decimals
        symbol
        logoURI
      }
      lp {
        chainId
        address
        name
        decimals
        symbol
        logoURI
      }
      stats {
        tvl_pc
        tvl_coin
        price
        vol24h
      }
    }
  }
`;

const fetcher = () =>
  request<{ pools: PoolStats[] }>(
    "https://saberqltest.aleph.cloud/",
    STATS_QUERY,
  );

interface PoolStats {
  ammId: string;
  coin: TokenInfo;
  lp: TokenInfo;
  pc: TokenInfo;
  stats: {
    price: number | null;
    tvl_coin: number | null;
    tvl_pc: number | null;
    vol24h: number | null;
  };
}

export const useStats = () => {
  return useQuery(["poolStats"], async () => {
    const data = await fetcher();
    return data.pools;
  });
};
