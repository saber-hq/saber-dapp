import type { MinerData } from "@quarryprotocol/quarry-sdk";
import type { QuarryInfo } from "@quarryprotocol/react-quarry";
import { useMiner, useRewarder } from "@quarryprotocol/react-quarry";
import type { ProgramAccount, TokenAmount } from "@saberhq/token-utils";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import { useAllPoolsWithUserBalances } from "../exchange/useAllPoolsWithUserBalances";
import type { KnownPool } from "../useEnvironment";

/**
 * Information about a plot to farm/stake in.
 */
export interface PlotInfo {
  poolID: string;
  pool: KnownPool;

  // quarry
  minerData?: ProgramAccount<MinerData> | null;

  quarry?: QuarryInfo | null;

  multiRewardsQuarryLink?: string | null | undefined;
}

/**
 * useAllPlots
 * @returns
 */
const useAllPlotsInternal = (): {
  loading: boolean;
  plots: PlotInfo[];
  pools: {
    id: string;
    pool: KnownPool;
    /**
     * User pool balance.
     */
    userBalance?: TokenAmount | null;
  }[];
} => {
  const { quarries, quarriesLoading } = useRewarder();
  const { minersData, minersLoading } = useMiner();

  const { pools } = useAllPoolsWithUserBalances();

  const plots = useMemo(() => {
    return pools
      .map((pool): PlotInfo | null => {
        if (!pool) {
          return null;
        }

        // if quarry could be loading, return undefined
        // otherwise, try to find it or return null
        const quarry = quarriesLoading
          ? undefined
          : quarries?.find((q) =>
              q.quarry.account.tokenMintKey.equals(
                pool.pool.lpToken.mintAccount,
              ),
            ) ?? null;

        const minerData = quarry
          ? minersData?.find((m) => m?.account.quarry.equals(quarry?.key))
          : null;

        return {
          poolID: pool.id,
          pool: pool.pool,

          minerData,
          quarry,
          multiRewardsQuarryLink:
            quarry?.quarryMeta?.replicaQuarries.length ?? 0 > 0
              ? quarry?.quarryAppDepositLink
              : null,
        };
      })
      .filter((p): p is PlotInfo => !!p);
  }, [minersData, pools, quarries, quarriesLoading]);

  const loading = minersLoading || quarriesLoading;
  return { loading, plots, pools };
};

export const { useContainer: useAllPlots, Provider: AllPlotsProvider } =
  createContainer(useAllPlotsInternal);
