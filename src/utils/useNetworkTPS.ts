import { DEFAULT_NETWORK_CONFIG_MAP } from "@saberhq/solana-contrib";
import { useSolana } from "@saberhq/use-solana";
import * as Sentry from "@sentry/react";
import { Connection } from "@solana/web3.js";
import { useQuery } from "react-query";

import { RPCHealth, useRPCHealth } from "./useRPCHealthAndNotifier";

export const useNetworkTPS = () => {
  const { network } = useSolana();
  const { health } = useRPCHealth();

  return useQuery(
    ["networkTps", network, health],
    async () => {
      const connection = new Connection(
        DEFAULT_NETWORK_CONFIG_MAP[network].endpoint,
      );
      try {
        const performanceSamples =
          await connection.getRecentPerformanceSamples(5);
        const avgTpsSamples = performanceSamples
          .filter((sample) => sample.numTransactions !== 0)
          .map((sample) => sample.numTransactions / sample.samplePeriodSecs);
        if (avgTpsSamples.length === 0) {
          console.warn("No TPS samples returned from endpoint.");
          return 0;
        }
        const tps =
          avgTpsSamples.reduce((a, b) => a + b) / avgTpsSamples.length;
        console.log("Solana TPS:", tps);
        return tps;
      } catch (e) {
        Sentry.captureException(e);
        return 0;
      }
    },
    { enabled: health === RPCHealth.HEALTHY },
  );
};
