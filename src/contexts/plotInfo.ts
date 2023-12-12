import { createContainer } from "unstated-next";

import type { PlotInfo } from "../utils/farming/useAllPlots";

const useCurrentPlotInfoInner = (info?: PlotInfo | null): PlotInfo => {
  if (!info) {
    throw new Error("plot info not found");
  }
  return info;
};

export const {
  useContainer: useCurrentPlotInfo,
  Provider: CurrentPlotInfoProvider,
} = createContainer(useCurrentPlotInfoInner);
