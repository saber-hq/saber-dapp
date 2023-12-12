import { useSolana } from "@saberhq/use-solana";
import { useEffect, useState } from "react";
import { createContainer } from "unstated-next";

import { useConfig } from "../contexts/config";
import { DEFAULT_ENDPOINT_LABEL } from "./environments";
import { notify } from "./notifications";

export enum RPCHealth {
  HEALTHY = 0,
  UNHEALTHY = 1,
}

// We CANT use useState because this is async and the race condition
// results in double notification.
let lastRpcEndpointNotified: string | null = null;

/**
 * The RPC node is healthy only
 * @returns
 */
const useRPCHealthInternal = (): {
  health: RPCHealth | null;
  loading: boolean;
  error: Error | null;
} => {
  const { provider, network } = useSolana();
  const [health, setHealth] = useState<RPCHealth | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const {
    environments,
    originalEnvironments,
    currentAlternateEndpoint,
    setAlternateEndpoint,
  } = useConfig();

  const [networksFailed, setNetworksFailed] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        await provider.connection.getSlot();
        setHealth(RPCHealth.HEALTHY);

        return;
      } catch (e) {
        // error loading
        setError(e as Error);
      }

      setHealth(RPCHealth.UNHEALTHY);

      setNetworksFailed((old) => {
        return old.concat([
          environments[network].endpoint ===
          originalEnvironments[network].endpoint
            ? DEFAULT_ENDPOINT_LABEL
            : currentAlternateEndpoint,
        ]);
      });
    })();
  }, [
    currentAlternateEndpoint,
    environments,
    network,
    originalEnvironments,
    provider.connection,
    setAlternateEndpoint,
  ]);

  // Separate useEffect due to async
  useEffect(() => {
    const currentEnvironment = environments[network];
    const originalEnvironment = originalEnvironments[network];
    if (health === RPCHealth.HEALTHY) {
      // Notify if successfully connected to RPC. But only notify if it is a
      // custom network
      if (currentEnvironment?.alternateEndpoints) {
        if (currentEnvironment.endpoint !== originalEnvironment.endpoint) {
          if (lastRpcEndpointNotified !== currentAlternateEndpoint) {
            lastRpcEndpointNotified = currentAlternateEndpoint;
            notify({
              message: "Using custom RPC endpoint",
              description: currentAlternateEndpoint,
            });
          }
        }
      }
    } else if (health !== null) {
      const firstAlternateEndpoint =
        currentEnvironment?.alternateEndpoints &&
        Object.keys(currentEnvironment.alternateEndpoints)[0];

      // Users can get stuck on a broken RPC endpoint because the switcher is
      // hidden inside the wallet settings modal.
      // Unhealthy! Let's do something about it

      if (
        networksFailed.includes(firstAlternateEndpoint ?? "???") &&
        networksFailed.includes(DEFAULT_ENDPOINT_LABEL)
      ) {
        notify({
          message: "All RPC endpoints failed",
          description:
            "Alternatives attempted. Please check your network settings",
        });
        return;
      }

      if (currentEnvironment.endpoint === originalEnvironment.endpoint) {
        // If we are in default RPC

        if (firstAlternateEndpoint) {
          if (!networksFailed.includes(firstAlternateEndpoint)) {
            notify({
              message: "RPC unhealthy",
              description: `Switching to alternate endpoint: ${firstAlternateEndpoint}`,
            });
            setAlternateEndpoint(firstAlternateEndpoint);
          }
        } else {
          // In the saber app, we never reach this since there are alternate endpoints
          notify({
            message: "RPC unhealthy",
            description: "No alternate networks.",
          });
        }
      } else {
        if (!networksFailed.includes(DEFAULT_ENDPOINT_LABEL)) {
          notify({
            message: "RPC unhealthy",
            description: `Switching to default RPC endpoint`,
          });

          setAlternateEndpoint("");
        }
      }
    }
  }, [
    health,
    currentAlternateEndpoint,
    setAlternateEndpoint,
    environments,
    network,
    originalEnvironments,
    networksFailed,
  ]);

  return { health, error, loading: health === null };
};

export const { useContainer: useRPCHealth, Provider: RPCHealthProvider } =
  createContainer(useRPCHealthInternal);
