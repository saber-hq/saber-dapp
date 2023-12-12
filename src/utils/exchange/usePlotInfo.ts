import { useMemo } from "react";

import type { PlotInfo } from "../farming/useAllPlots";
import { useAllPlots } from "../farming/useAllPlots";

/**
 * Uses the info of a specific plot.
 * @param poolID
 * @returns
 */
export const usePlotInfo = (poolID?: string): PlotInfo | undefined | null => {
  const { plots, loading } = useAllPlots();
  return useMemo(
    () =>
      loading && plots.length === 0
        ? undefined
        : plots.find((plot) => plot.poolID === poolID) ?? null,
    [loading, plots, poolID],
  );
};
