import {
  useQuarry,
  useQuarrySDK,
  useRewarder,
} from "@quarryprotocol/react-quarry";
import { Saber, SABER_IOU_MINT, SBR_MINT } from "@saberhq/saber-periphery";
import type { HandleTXResponse } from "@saberhq/sail";
import { useSail } from "@saberhq/sail";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import { getOrCreateATAs } from "@saberhq/token-utils";
import { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";
import invariant from "tiny-invariant";

type ClaimFn = () => Promise<HandleTXResponse>;

export const useQuarryClaimAndRedeem = (): ClaimFn => {
  const { sdkMut } = useQuarrySDK();
  const { handleTX } = useSail();
  const { rewarderKey, rewardToken } = useRewarder();
  const { stakedToken } = useQuarry();

  return useCallback(async () => {
    invariant(sdkMut, "sdk not connected");
    invariant(stakedToken, "staked token");
    invariant(rewardToken, "reward token");

    const redeemerSDK = Saber.load({ provider: sdkMut.provider });
    const redeemer = await redeemerSDK.loadRedeemer({
      iouMint: SABER_IOU_MINT,
      redemptionMint: new PublicKey(SBR_MINT),
    });

    const authority = sdkMut.provider.wallet.publicKey;
    const rewarderW = await sdkMut.mine.loadRewarderWrapper(rewarderKey);
    const quarryW = await rewarderW.getQuarry(stakedToken);
    const minerW = await quarryW.getMinerActions(authority);

    const claimTX = await minerW.claim();

    // claim instruction
    const claimIX = claimTX.instructions[claimTX.instructions.length - 1];
    invariant(claimIX, "claim instruction");

    const { accounts, instructions } = await getOrCreateATAs({
      provider: sdkMut.provider,
      mints: {
        iou: redeemer.data.iouMint,
        redemption: redeemer.data.redemptionMint,
      },
      owner: authority,
    });

    // handle the TX
    return await handleTX(
      new TransactionEnvelope(sdkMut.provider, [
        ...instructions, // instructions for ATAs
        claimIX,
        // redeem instruction
        await redeemer.redeemAllTokensFromMintProxyIx({
          iouSource: accounts.iou,
          redemptionDestination: accounts.redemption,
          sourceAuthority: authority,
        }),
      ]),
      `Claim SBR`,
    );
  }, [handleTX, rewardToken, rewarderKey, sdkMut, stakedToken]);
};
