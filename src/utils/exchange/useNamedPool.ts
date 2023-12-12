import { useMemo } from "react";

import type { KnownPool } from "../useEnvironment";
import { useEnvironment } from "../useEnvironment";

/**
 * Uses a pool which is named and stored in the environment configuration.
 * @param poolID
 * @returns
 */
export const useNamedPool = (
  poolID: string,
): { loading: boolean; pool: KnownPool | null } => {
  const { pools, loading: envLoading } = useEnvironment();
  const loading = envLoading;
  const pool = useMemo(() => {
    const id = poolID.toLowerCase();
    return pools[id] ?? null;
  }, [poolID, pools]);
  return { loading, pool };
};
