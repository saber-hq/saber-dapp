import { useSail } from "@saberhq/sail";
import { PendingTransaction } from "@saberhq/solana-contrib";
import {
  useConnectedWallet,
  useConnectionContext,
  useSendConnection,
} from "@saberhq/use-solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import invariant from "tiny-invariant";

import { useSDK } from "../../../contexts/sdk";
import { notify } from "../../../utils/notifications";

export const useHandleSolAirdrop = (): (() => Promise<void>) => {
  const wallet = useConnectedWallet();
  const sendConnection = useSendConnection();
  const { network } = useConnectionContext();
  const { refetch } = useSail();
  const { saber } = useSDK();
  return async () => {
    try {
      if (!wallet) {
        throw new Error("wallet is null");
      }
      invariant(saber, "SDK not connected");
      if (!(network === "devnet" || network === "testnet")) {
        const err = `Cannot airdrop in ${network?.toString() ?? "null"}`;
        notify({
          message: err,
          type: "error",
        });
        throw new Error(err);
      }

      const pendingTX = new PendingTransaction(
        sendConnection,
        await sendConnection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL),
      );
      notify({
        env: network,
        message: `Request 1 airdropped SOL`,
        txid: pendingTX.signature,
      });
      void (async () => {
        await pendingTX.wait();
        await refetch(wallet.publicKey);
      })();
    } catch (e) {
      console.error(e);
      notify({
        env: network,
        message: `SOL airdrop error: ${(e as Error).message}`,
      });
    }
  };
};
