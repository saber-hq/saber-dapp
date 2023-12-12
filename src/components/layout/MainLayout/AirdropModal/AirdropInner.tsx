import {
  findClaimStatusKey,
  MerkleDistributorSDK,
} from "@saberhq/merkle-distributor";
import { Saber, SBR_MINT } from "@saberhq/saber-periphery";
import { useAccountData, useSail } from "@saberhq/sail";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import {
  getOrCreateATAs,
  SPLToken,
  TokenAmount,
  u64,
} from "@saberhq/token-utils";
import { useSolana } from "@saberhq/use-solana";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import Confetti from "react-confetti";
import { useQuery } from "react-query";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";

import {
  AIRDROP_IOU_MINT,
  AIRDROP_MERKLE_DISTRIBUTOR_KEY,
} from "../../../../utils/constants";
import { useGovernanceToken } from "../../../../utils/farming/useGovernanceToken";
import useWindowDimensions from "../../../../utils/useWindowDimensions";
import { Alert } from "../../../common/Alert";
import { Button } from "../../../common/Button";
import { Modal } from "../../../common/Modal";
import { ModalBottom } from "../../../common/Modal/modalParts";
import { SeenIsCollapse } from "../../../common/SeenIsCollapse";
import { TokenAmountDisplay } from "../../../common/TokenAmountDisplay";
import { ClaimButton } from "../../../pages/tools/LockupView/ClaimModal";

const generateAirdropProofLink = (key: PublicKey): string =>
  `https://airdrop-artifacts.saber.so/proofs/${key.toString()}.json`;

const fetchAirdropLink = (url: string) =>
  fetch(url).then((res) => {
    if (res.status === 404) {
      return null;
    }
    return res.json();
  });

export const AirdropInner: React.FC = () => {
  const { providerMut, network } = useSolana();
  const { handleTX } = useSail();
  if (!providerMut) {
    throw new Error("no wallet");
  }
  const { data: airdropInfo } = useQuery(
    ["airdropInfo", network, providerMut.wallet.publicKey.toString()],
    async () => {
      const link = generateAirdropProofLink(providerMut.wallet.publicKey);
      const resultRaw = (await fetchAirdropLink(link)) as {
        index: number;
        amount: string;
        proof: string[];
      } | null;
      if (resultRaw) {
        return {
          index: new u64(resultRaw.index),
          amount: new u64(resultRaw.amount),
          proof: resultRaw.proof.map((elt) => Buffer.from(elt, "hex")),
        };
      }
      return null;
    },
    {
      // fetch once and we're good
      staleTime: Infinity,
    },
  );

  const { width, height } = useWindowDimensions();
  const [show, setShow] = useState<boolean>(false);

  const { data: claimStatusKey } = useQuery(
    ["claimStatus", network, airdropInfo?.index.toString()],
    async () => {
      invariant(airdropInfo !== undefined, "airdrop info");
      if (airdropInfo === null) {
        return null;
      }
      const [nextKey] = await findClaimStatusKey(
        airdropInfo.index,
        AIRDROP_MERKLE_DISTRIBUTOR_KEY,
      );
      return nextKey;
    },
    {
      enabled: airdropInfo !== undefined,
    },
  );
  const { data: claimStatusData, loading } = useAccountData(claimStatusKey);

  const { data: sbr } = useGovernanceToken();

  const isAirdropAvailable = !(
    !airdropInfo ||
    !sbr ||
    !!claimStatusData ||
    claimStatusData === undefined ||
    loading ||
    claimStatusKey === null
  );

  const claimAirdrop = async () => {
    invariant(airdropInfo, "airdrop info");
    const sdk = MerkleDistributorSDK.load({ provider: providerMut });
    const redeemerSDK = Saber.load({ provider: providerMut });

    const distributorW = await sdk.loadDistributor(
      AIRDROP_MERKLE_DISTRIBUTOR_KEY,
    );
    const sbrAddress = new PublicKey(SBR_MINT);
    const redeemerW = await redeemerSDK.loadRedeemer({
      iouMint: AIRDROP_IOU_MINT,
      redemptionMint: sbrAddress,
    });

    const atas = await getOrCreateATAs({
      provider: providerMut,
      mints: {
        iou: AIRDROP_IOU_MINT,
        redemption: sbrAddress,
      },
      owner: providerMut.wallet.publicKey,
    });
    if (atas.instructions.length > 0) {
      const { success: createATAsSuccess, pending: createATAsPending } =
        await handleTX(
          new TransactionEnvelope(providerMut, [...atas.instructions]),
          "Create token accounts",
        );
      if (!createATAsSuccess) {
        throw new Error("Error creating token accounts");
      }
      await createATAsPending?.wait({ commitment: "confirmed" });
    }

    const claimTX = new TransactionEnvelope(providerMut, [
      await distributorW.claimIX(
        {
          ...airdropInfo,
          claimant: providerMut.wallet.publicKey,
        },
        providerMut.wallet.publicKey,
      ),
      // redeem tokens
      await redeemerW.redeemAllTokensFromMintProxyIx({
        sourceAuthority: providerMut.wallet.publicKey,
        iouSource: atas.accounts.iou,
        redemptionDestination: atas.accounts.redemption,
      }),
      // close IOU account
      SPLToken.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        atas.accounts.iou,
        providerMut.wallet.publicKey,
        providerMut.wallet.publicKey,
        [],
      ),
    ]);
    const { success } = await handleTX(claimTX, "Claim Airdrop");
    if (success) {
      setShow(false);
    }
  };

  return (
    <>
      <SeenIsCollapse visible={isAirdropAvailable}>
        <Alert>
          <h2>Airdrop available</h2>
          <p>
            Your account is eligible to claim SBR tokens as compensation for the
            reduced rewards bug.
          </p>
          <Button tw="mt-3" onClick={() => setShow(true)}>
            Claim Airdrop
          </Button>
        </Alert>
      </SeenIsCollapse>
      {sbr && airdropInfo && (
        <Modal
          title="Claim Airdrop"
          isOpen={show}
          onDismiss={() => {
            setShow(false);
          }}
        >
          <Confetti width={width} height={height} recycle={false} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio autoPlay>
            <source src="/airdrop.ogg" type="audio/ogg" />
          </audio>
          <TopArea>
            <Congrats>Congratulations! 🎉</Congrats>
            <p>You have received an airdrop of:</p>
            <Amount>
              <TokenAmountDisplay
                amount={new TokenAmount(sbr, airdropInfo.amount)}
              />
            </Amount>
            <ClaimButton onClick={claimAirdrop}>Claim Airdrop</ClaimButton>
          </TopArea>
          <Bottom>
            <p>Thank you for using Saber!</p>
          </Bottom>
        </Modal>
      )}
    </>
  );
};

const Bottom = styled(ModalBottom)`
  padding-top: 36px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.bold};
`;

const TopArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
`;

const Congrats = styled.h2`
  font-weight: bold;
  margin-bottom: 24px;
`;

const Amount = styled.span`
  font-weight: bold;
  font-size: 48px;
  line-height: 43px;
  color: ${({ theme }) => theme.colors.text.bold};
  margin-bottom: 48px;
`;

export default AirdropInner;
