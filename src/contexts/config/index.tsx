import type { Network } from "@saberhq/solana-contrib";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

import type { IEnvironment } from "../../utils/environments";
import { environments as environmentsConfig } from "../../utils/environments";
import { useLocalStorageState } from "../../utils/utils";

type EnvironmentsMap = { [N in Network]: IEnvironment };

interface UseConfig {
  /**
   * The patched environments object, with the alternate endpoint patched in
   */
  environments: EnvironmentsMap;
  originalEnvironments: EnvironmentsMap;
  /**
   * May correspond to something not in the current network such as "".
   *
   * Alternate endpoint could also be the DEFAULT_ENDPOINT_LABEL.
   */
  currentAlternateEndpoint: string;
  setAlternateEndpoint: (altEndpoint: string) => void;
}

export interface Flags {
  /**
   * Whether or not to use the RPC1 mainnet nodes.
   */
  "use-rpc1-nodes": boolean;
}

export const DEFAULT_FLAGS: Flags = {
  "use-rpc1-nodes": false,
};

const useConfigInternal = (): UseConfig => {
  const environments: EnvironmentsMap = useMemo(() => {
    return environmentsConfig;
  }, []);

  const [currentAlternateEndpoint, setAlternateEndpoint] =
    useLocalStorageState<string>("alternateEndpoint", "");

  // Sorry it's a bit overengineered.
  const endpointPatchedEnvironments = useMemo(() => {
    let possiblyNewenvironments = environments;

    if (currentAlternateEndpoint) {
      for (const [network, env] of Object.entries(environments)) {
        const altEndpoint = env.alternateEndpoints?.[currentAlternateEndpoint];
        if (altEndpoint) {
          // Avoid mutating original, but avoid creating new object unless
          // absolutely necessary just in case we have issues with hooks and equality
          possiblyNewenvironments = Object.assign({}, environments);
          const networkConfig = possiblyNewenvironments[network as Network];
          if (networkConfig) {
            possiblyNewenvironments[network as Network] = Object.assign(
              {},
              networkConfig,
              {
                endpoint: altEndpoint,
              },
            );
          }
        }
      }
    }
    return possiblyNewenvironments;
  }, [environments, currentAlternateEndpoint]);

  return {
    environments: endpointPatchedEnvironments,
    originalEnvironments: environments,
    currentAlternateEndpoint,
    setAlternateEndpoint,
  };
};

export const { Provider: ConfigProvider, useContainer: useConfig } =
  createContainer(useConfigInternal);
