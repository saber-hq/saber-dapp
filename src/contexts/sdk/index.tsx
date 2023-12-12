import { Saber } from "@saberhq/saber-periphery";
import {
  DEFAULT_PROVIDER_OPTIONS,
  SignerWallet,
  SolanaProvider,
} from "@saberhq/solana-contrib";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import type { PublicKey } from "@solana/web3.js";
import { Connection, Keypair } from "@solana/web3.js";
import { useMemo } from "react";
import { createContainer } from "unstated-next";

// TODO: spoof origins
const MAINNET_CONNECTIONS = [
  "https://solana-api.projectserum.com",
  "https://api.mainnet-beta.solana.com/",
].map((url) => new Connection(url));

export const useSDKInternal = (): {
  saber: Saber | null;
  /**
   * Saber SDK where only read functions work
   */
  saberReadOnly: Saber;

  owner: PublicKey | null;
} => {
  const { connection, network } = useConnectionContext();
  const wallet = useConnectedWallet();

  const { saber: saberReadOnly } = useMemo(() => {
    const providerDummy = SolanaProvider.init({
      connection,
      wallet: new SignerWallet(Keypair.generate()),
      opts: DEFAULT_PROVIDER_OPTIONS,
    });
    return {
      saber: Saber.load({
        provider: providerDummy,
      }),
    };
  }, [connection]);

  const { saber } = useMemo(() => {
    if (!wallet) {
      return { saber: null, legacySaber: null };
    }

    const broadcastConnections =
      network === "mainnet-beta"
        ? [...MAINNET_CONNECTIONS, connection]
        : [connection];

    const provider = SolanaProvider.init({
      connection,
      broadcastConnections,
      wallet,
    });

    return {
      saber: Saber.load({
        provider,
      }),
    };
  }, [connection, wallet, network]);

  const owner = useMemo(
    () => saber?.provider.wallet.publicKey ?? null,
    [saber?.provider.wallet.publicKey],
  );

  return {
    saber,
    saberReadOnly,
    owner,
  };
};

export const { useContainer: useSDK, Provider: SDKProvider } =
  createContainer(useSDKInternal);
