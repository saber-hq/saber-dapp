import { useSail } from "@saberhq/sail";
import { TokenAmount } from "@saberhq/token-utils";
import React, { useCallback, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { css, styled } from "twin.macro";

import { useSDK } from "../../../../contexts/sdk";
import { CurrencyMarket } from "../../../../utils/currencies";
import { useGovernanceToken } from "../../../../utils/farming/useGovernanceToken";
import { notify } from "../../../../utils/notifications";
import { AsyncButton } from "../../../common/AsyncButton";
import type { ModalProps } from "../../../common/Modal";
import { Modal } from "../../../common/Modal";
import { ModalBody, ModalBottom } from "../../../common/Modal/modalParts";
import { TokenAmountSelector } from "../../../common/TokenAmountSelector";

export type ClaimModalProps = Omit<ModalProps, "children" | "title"> & {
  availableForWithdrawal: TokenAmount | null | undefined;
  onClaim?: () => void;
};

export const ClaimModal: React.FC<ClaimModalProps> = ({
  availableForWithdrawal,
  ...modalProps
}: ClaimModalProps) => {
  const { saber } = useSDK();
  const { handleTX } = useSail();
  const { data: sbr } = useGovernanceToken();
  const [amount, setAmount] = useState<string>("");

  const amountParsed = useMemo(() => {
    if (!sbr) {
      return null;
    }
    try {
      return TokenAmount.parse(sbr, amount);
    } catch (e) {
      return null;
    }
  }, [sbr, amount]);

  const doClaim = useCallback(async () => {
    invariant(saber, "saber");
    invariant(amountParsed, "amount parsed");

    if (!availableForWithdrawal) {
      notify({
        message: "No tokens available for withdrawal",
        description:
          "If you believe this is an error, please contact the Saber team.",
        type: "error",
      });
      return;
    }

    if (amountParsed.greaterThan(availableForWithdrawal)) {
      notify({
        message: "Not enough tokens",
        description: `You may only unlock up to ${availableForWithdrawal.formatUnits()}.`,
        type: "error",
      });
      return;
    }

    // max SBR claim
    if (availableForWithdrawal.equalTo(amountParsed)) {
      await handleTX(
        await saber.lockup.withdraw(saber.provider.wallet.publicKey),
        `Claim ${availableForWithdrawal.formatUnits()}`,
      );
      return;
    } else {
      // claim an amount
      await handleTX(
        await saber.lockup.withdraw(
          saber.provider.wallet.publicKey,
          amountParsed.toU64(),
        ),
        `Claim ${amountParsed.formatUnits()}`,
      );
    }
    setAmount("");
    modalProps.onDismiss();
  }, [amountParsed, availableForWithdrawal, handleTX, modalProps, saber]);

  return (
    <Modal title="Claim Lockup" {...modalProps}>
      <ModalBody>
        <TokenAmountSelector
          tokens={[]}
          selectedValue={sbr ?? null}
          inputValue={amount}
          inputOnChange={setAmount}
          currentAmount={{
            amount: availableForWithdrawal ?? undefined,
            allowSelect: true,
            label: "Max",
          }}
          currency={CurrencyMarket.SBR}
        />
      </ModalBody>
      <ModalBottom>
        <p>
          <span>You may be asked to confirm the transaction</span>
          <span
            css={css`
              margin-left: 4px;
            `}
          >
            via your wallet.
          </span>
        </p>
        <ClaimButton
          disabled={
            !amountParsed ||
            !saber ||
            !availableForWithdrawal ||
            amountParsed.greaterThan(availableForWithdrawal)
          }
          size="large"
          onClick={doClaim}
        >
          Claim
        </ClaimButton>
      </ModalBottom>
    </Modal>
  );
};

export const ClaimButton = styled(AsyncButton)`
  &:hover:not(:disabled) {
    background: linear-gradient(
      to right,
      #25aae1 0%,
      #40e495,
      #9198e5 66%,
      #25aae1 100%
    );
    background-size: 400% 400%;

    animation-name: hover-button;
    animation-duration: 1000s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;

    @keyframes hover-button {
      0% {
        background-position: 0% 50%;
      }
      100% {
        background-position: 100000% 100050%;
      }
    }
  }
`;
