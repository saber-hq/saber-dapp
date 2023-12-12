import { useWalletKit, WalletKitProvider } from "@gokiprotocol/walletkit";
import type { Network } from "@saberhq/solana-contrib";
import type { ConnectedWallet, WalletProviderInfo } from "@saberhq/use-solana";
import * as Sentry from "@sentry/react";
import React from "react";
import { isMobile } from "react-device-detect";
import { css } from "twin.macro";

import { ReactComponent as SaberIcon } from "../../components/common/svgs/IconColor.svg";
import { notify } from "../../utils/notifications";
import { useConfig } from "../config";

export type ConnectWallet = () => void;

interface Props {
  children: React.ReactNode;
}

const onConnect = (wallet: ConnectedWallet, provider: WalletProviderInfo) => {
  const walletPublicKey = wallet.publicKey.toBase58();

  const keyToDisplay =
    walletPublicKey.length > 20
      ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(
          walletPublicKey.length - 7,
          walletPublicKey.length,
        )}`
      : walletPublicKey;

  Sentry.setContext("wallet", {
    provider: provider.name,
    isMobile: isMobile,
  });

  window.gtag?.("set", {
    wallet_provider: provider.name,
    wallet_key: walletPublicKey,
  });
  window.gtag?.("event", "wallet_connect", {
    wallet_provider: provider.name,
  });

  notify({
    message: "Wallet update",
    description: "Connected to wallet " + keyToDisplay,
  });
};

const onDisconnect = () => {
  Sentry.setContext("wallet", {
    provider: null,
  });

  notify({
    message: "Wallet disconnected",
  });

  window.gtag?.("set", {
    wallet_provider: null,
    wallet_key: null,
  });
  window.gtag?.("event", "wallet_disconnect");
};

const onError = (err: Error) => {
  notify({
    message: `Error connecting to wallet`,
    description: err.message,
  });
  Sentry.captureException(err, {
    tags: {
      source: "walletkit",
    },
  });
};

export const DEFAULT_NETWORK: Network =
  window.location.hostname === "devnet.app.saber.so" ||
  window.location.hostname === "devnet.saber.so" ||
  window.location.hostname === "devnet.beta.saber.so"
    ? "devnet"
    : window.location.hostname === "testnet.app.saber.so" ||
        window.location.hostname === "testnet.saber.so" ||
        window.location.hostname === "testnet.beta.saber.so"
      ? "testnet"
      : "mainnet-beta";

console.log(
  `Connecting to ${DEFAULT_NETWORK} on hostname: ${window.location.hostname}`,
);

export const WalletConnectorProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const { environments } = useConfig();
  return (
    <WalletKitProvider
      defaultNetwork={DEFAULT_NETWORK}
      networkConfigs={
        DEFAULT_NETWORK !== "mainnet-beta"
          ? { [DEFAULT_NETWORK]: environments[DEFAULT_NETWORK] }
          : environments
      }
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      app={{
        name: "Saber",
        icon: (
          <SaberIcon
            css={css`
              width: 48px;
              height: 48px;
            `}
          />
        ),
      }}
      onError={onError}
    >
      {children}
    </WalletKitProvider>
  );
};

/**
 * Returns a function which shows the wallet selector modal.
 */
export const useConnectWallet = (): (() => void) => {
  const { connect } = useWalletKit();
  return connect;
};
