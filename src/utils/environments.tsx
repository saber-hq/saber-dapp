import type { Network } from "@saberhq/solana-contrib";

export type IEnvironment = Readonly<{
  name: string;
  endpoint: string;
  /**
   * A mapping of alternate endpoints. Key of chosen endpoint will will be saved
   * in localStorage.alternateEndpoint. If invalid or nothing found, will
   * default back `endpoint`
   */
  alternateEndpoints?: Record<string, string>;
}>;

export type IExchangeBasic = {
  /**
   * Name of the pool to use in the pool list.
   */
  name?: string;
  swapAccount: string;
  lpToken: string;
  tokenA: string;
  tokenB: string;
  devOnly?: boolean;
  swapIcons?: boolean;
};

export const environments = {
  "mainnet-beta": {
    name: "Mainnet Beta",
    endpoint: "https://stableswap.rpcpool.com/",
    alternateEndpoints: {
      "Helius RPC":
        "https://mainnet.helius-rpc.com/?api-key=26bec238-00c2-4961-ba13-faa7c0a2d767",
    },
  },
  devnet: {
    name: "Devnet",
    endpoint: `https://stage.devnet.rpcpool.com/${
      process.env.REACT_APP_RPC_POOL_DEVNET_TOKEN ?? ""
    }`,
    alternateEndpoints: {
      "Solana Foundation RPC": "https://api.devnet.solana.com/",
    },
    // endpoint: "https://api.devnet.solana.com/",
    // endpoint: "https://sg6.rpcpool.com/",
  },
  testnet: {
    name: "Testnet",
    endpoint: "https://api.testnet.solana.com/",
  },
  localnet: {
    name: "Localnet",
    endpoint: "http://localhost:8899/",
    exchanges: {},
  },
} as const;

export const DEFAULT_ENDPOINT_LABEL = "Default (Saber RPC)";

export const getEnvironment = (network: Network): IEnvironment =>
  environments[network];
