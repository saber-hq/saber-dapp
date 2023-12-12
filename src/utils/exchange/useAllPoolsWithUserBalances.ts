import { useUserATAs } from "@saberhq/sail";
import type { TokenAmount } from "@saberhq/token-utils";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import type { KnownPool } from "../useEnvironment";
import { useEnvironment } from "../useEnvironment";
import { useTVL } from "./useTVL";

export interface PoolWithUserBalance {
  id: string;
  pool: KnownPool;
  /**
   * User pool balance.
   */
  userBalance?: TokenAmount | null;
}

/**
 * Fetches all pools with the user's balance in the pool.
 * @returns
 */
const useAllPoolsWithUserBalancesInner = (): {
  pools: PoolWithUserBalance[];
  userBalancesLoading: boolean;
} => {
  const { pools } = useEnvironment();
  const poolsWithIDs = useMemo(() => Object.entries(pools), [pools]);
  const userBalances = useUserATAs(
    ...poolsWithIDs.map(([_, pool]) => pool.lpToken),
  );

  const { tvlMap } = useTVL();

  const poolsSorted = useMemo(() => {
    return poolsWithIDs
      .map(([poolID, pool]) => {
        return {
          id: poolID,
          pool,
        };
      })
      .sort((a, b): number => {
        const tvlA = tvlMap[a.id];
        const tvlB = tvlMap[b.id];
        if (!tvlA) {
          return -1;
        }
        if (!tvlB) {
          return 1;
        }
        if (tvlA.equalTo(tvlB)) {
          return a.id < b.id ? -1 : a.id === b.id ? 0 : 1;
        }
        return tvlA.greaterThan(tvlB) ? -1 : 1;
      });
  }, [poolsWithIDs, tvlMap]);

  const poolsWithUserBalances = useMemo(() => {
    if (!userBalances.every((user) => user !== undefined)) {
      return poolsSorted;
    }
    return poolsSorted.map((pool) => {
      const ata = userBalances.find(
        (b) => b?.balance.token.equals(pool.pool.lpToken),
      );
      return {
        ...pool,
        userBalance: ata?.balance ?? null,
      };
    });
  }, [poolsSorted, userBalances]);

  return {
    pools: poolsWithUserBalances,
    userBalancesLoading: userBalances.findIndex((b) => !b) !== -1,
  };
};

export const {
  useContainer: useAllPoolsWithUserBalances,
  Provider: AllPoolsProvider,
} = createContainer(useAllPoolsWithUserBalancesInner);
