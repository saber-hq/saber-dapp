import { useSail } from "@saberhq/sail";
import type { Network } from "@saberhq/solana-contrib";
import type { Token } from "@saberhq/token-utils";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import { PublicKey } from "@solana/web3.js";
import type { AxiosResponse } from "axios";
import axios from "axios";

interface AirdropResult {
  txSig: string;
  amount: number;
  tokenAccount: PublicKey;
}

const FAUCET_URL = `https://api.saber.so/api/v1/faucet`;

const requestAirdrop = async (
  tokenMint: PublicKey,
  owner: PublicKey,
  tweetURL: string,
  claimID: string,
  env: Network,
  mega = false,
): Promise<AirdropResult> => {
  const result: AxiosResponse<AirdropResult> = await axios.post(FAUCET_URL, {
    token: tokenMint.toString(),
    owner: owner.toString(),
    tweetURL,
    claimID,
    cluster: env === "devnet" ? "devnetv2" : env,
    mega,
  });

  return {
    ...result.data,
    tokenAccount: new PublicKey(result.data.tokenAccount),
  };
};

export const useHandleSPLAirdrop = (
  token: Token | undefined,
  openModal: (visible: boolean) => void,
): ((tweetURL: string, claimID: string, mega?: boolean) => Promise<void>) => {
  const wallet = useConnectedWallet();
  const { network } = useConnectionContext();
  const { refetch } = useSail();

  return async (tweetURL: string, claimID: string, mega?: boolean) => {
    if (!wallet) {
      throw new Error("swap or wallet is null");
    }
    if (!token) {
      throw new Error("token not loaded");
    }
    if (
      !(network === "devnet" || network === "testnet" || network === "localnet")
    ) {
      throw new Error(`cannot airdrop in ${network}`);
    }

    try {
      const { tokenAccount } = await requestAirdrop(
        token.mintAccount,
        wallet.publicKey,
        tweetURL,
        claimID,
        network,
        mega,
      );

      console.debug("Airdrop requested; queueing up");
      await refetch(tokenAccount);

      // notify({
      //   env,
      //   txid: txSig,
      // });
      // void message.success(
      //   `Received ${toUIAmount(new u64(amount)).toFixed(0)} ${
      //     token.symbol
      //   }!`
      // );
    } catch (e) {
      console.error("Airdrop failed", e);
      // ignore errors
    }

    openModal(true);
  };
};
