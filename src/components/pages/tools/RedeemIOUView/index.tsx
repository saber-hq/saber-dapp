import { Saber, SABER_IOU_MINT, SBR_MINT } from "@saberhq/saber-periphery";
import { useSail, useUserATAs } from "@saberhq/sail";
import {
  createMemoInstruction,
  SingleConnectionBroadcaster,
  SolanaProvider,
} from "@saberhq/solana-contrib";
import { DEFAULT_TOKEN_DECIMALS } from "@saberhq/stableswap-sdk";
import {
  NETWORK_TO_CHAIN_ID,
  Token,
  TokenAmount,
  ZERO,
} from "@saberhq/token-utils";
import {
  useConnectedWallet,
  useConnectionContext,
  useSendConnection,
} from "@saberhq/use-solana";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { css, styled } from "twin.macro";

import { SBR_INFO } from "../../../../utils/builtinTokens";
import { AsyncButton } from "../../../common/AsyncButton";
import { TextInput } from "../../../common/inputs/TextInput";
import { TokenAmountDisplay } from "../../../common/TokenAmountDisplay";
import { MainLayout } from "../../../layout/MainLayout";
import { SubLayout } from "../../../layout/SubLayout";

export const RedeemIOUView: React.FC = () => {
  const wallet = useConnectedWallet();
  const connection = useSendConnection();
  const { network } = useConnectionContext();
  const { handleTX } = useSail();
  const [memo, setMemo] = useState("");

  const iouToken = new Token({
    ...SBR_INFO,
    chainId: NETWORK_TO_CHAIN_ID[network],
    address: SABER_IOU_MINT.toString(),
    name: "Saber IOU",
    decimals: DEFAULT_TOKEN_DECIMALS,
    symbol: "IOU",
  });

  const [iouTokenAccount] = useUserATAs(iouToken);

  const handleRedemption = async (): Promise<void> => {
    if (!wallet) {
      throw new Error("wallet is null");
    }

    const provider = new SolanaProvider(
      connection,
      new SingleConnectionBroadcaster(connection),
      wallet,
    );

    const redeemerSDK = Saber.load({ provider });
    const redeemer = await redeemerSDK.loadRedeemer({
      iouMint: SABER_IOU_MINT,
      redemptionMint: new PublicKey(SBR_MINT),
    });

    const tx = await redeemer.redeemTokensFromMintProxy();
    if (memo !== "") {
      tx.instructions.push(createMemoInstruction(memo));
    }

    await handleTX(
      tx,
      `redeeming ${
        iouTokenAccount?.balance.toFixed(DEFAULT_TOKEN_DECIMALS) ?? "0"
      } iou tokens`,
    );
  };

  return (
    <>
      <MainLayout title="Redeem IOU Tokens" hideOptions>
        <SubLayout noPad>
          <div tw="flex flex-col gap-2 text-sm">
            <span tw="font-medium">Memo (optional)</span>
            <TextInput
              type="text"
              value={memo}
              onChange={(e) => {
                setMemo(e.target.value);
              }}
            />
          </div>
          <InnerSection title="IOU amount">
            <>
              <TokenAmountDisplay
                showIcon
                css={css`
                  color: white;
                `}
                amount={
                  iouTokenAccount?.balance ?? new TokenAmount(iouToken, ZERO)
                }
              />
              <AsyncButton
                size="small"
                disabled={
                  !iouTokenAccount ||
                  iouTokenAccount === undefined ||
                  iouTokenAccount.balance.equalTo(ZERO)
                }
                onClick={async () => await handleRedemption()}
              >
                Redeem
              </AsyncButton>
            </>
          </InnerSection>
        </SubLayout>
      </MainLayout>
    </>
  );
};

const InnerSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
