/* eslint-disable jsx-a11y/label-has-associated-control */
import type { TokenAmount } from "@saberhq/token-utils";
import { Fraction, Percent } from "@saberhq/token-utils";
import * as Sentry from "@sentry/react";
import React from "react";
import { FaExclamation } from "react-icons/fa";
import tw, { css, styled } from "twin.macro";

import { useSDK } from "../../../../contexts/sdk";
import { useConnectWallet } from "../../../../contexts/wallet";
import type { IUseDeposit } from "../../../../utils/exchange/useDeposit";
import {
  formatSharePercent,
  useUserPoolShare,
} from "../../../../utils/exchange/useUserPoolShare";
import { formatCurrencySmart } from "../../../../utils/format";
import { useStableSwap } from "../../../../utils/useStableSwap";
import { AsyncButton } from "../../../common/AsyncButton";
import { Button } from "../../../common/Button";
import type { ModalProps as IModalProps } from "../../../common/Modal";
import { Modal } from "../../../common/Modal";
import { ModalBottom } from "../../../common/Modal/modalParts";
import { TokenAmountDisplay } from "../../../common/TokenAmountDisplay";

interface IProps extends Omit<IModalProps, "children" | "title"> {
  tokenAmounts: readonly TokenAmount[];
  onSuccess?: () => void;
  deposit: IUseDeposit;
}

export const DepositConfirmModal: React.FC<IProps> = ({
  deposit: { handleDeposit, estimatedMint },
  tokenAmounts,
  onSuccess,
  ...modalProps
}: IProps) => {
  const { saber } = useSDK();
  const { currency } = useStableSwap();
  const connect = useConnectWallet();
  const { total, shareValue: shareDollarValue } = useUserPoolShare();
  const addedDollarValue = tokenAmounts
    .map((amt) => amt.asFraction)
    .reduce((acc, el) => acc.add(el), new Fraction(0, 1));

  const newDollarValue = shareDollarValue
    ? addedDollarValue.add(shareDollarValue)
    : undefined;
  const newShareFraction = total
    ? newDollarValue?.divide(total.add(addedDollarValue))
    : undefined;
  const newSharePercent = newShareFraction
    ? new Percent(newShareFraction.numerator, newShareFraction.denominator)
    : undefined;

  if (!saber && modalProps.isOpen) {
    // XXX(michael): Figure out why Saber SDK might be null here ...
    Sentry.captureException(
      new Error("Saber SDK not loaded while deposit modal is open"),
    );
  }

  const renderConnectWalletButton = () => {
    return (
      <>
        <div tw="w-full py-12 text-sm flex flex-col items-center">
          <div
            tw="w-20 h-20 mb-3"
            css={css`
              & > svg,
              & > img {
                ${tw`w-full h-full text-gray-300`}
              }
            `}
          >
            <FaExclamation />
          </div>
          <div tw="h-6">{"Wallet not connected"}</div>
        </div>
        <Button
          key="connectWallet"
          size="large"
          variant="secondary"
          onClick={() => connect()}
        >
          Connect Wallet
        </Button>
      </>
    );
  };

  return (
    <Modal title="Review Deposit" {...modalProps}>
      {saber ? (
        <>
          <Estimate>
            <label>Total Deposit</label>
            <span>{formatCurrencySmart(addedDollarValue, currency)}</span>
          </Estimate>
          <Info>
            <InfoRow>
              <label>Deposit Currencies</label>
              <DepositCurrencies>
                {tokenAmounts.map((amt) => (
                  <TokenAmountDisplay
                    key={amt.token.address}
                    amount={amt}
                    showIcon
                  />
                ))}
              </DepositCurrencies>
            </InfoRow>
            <InfoRow>
              <label>New pool share</label>
              <span>
                {formatCurrencySmart(
                  newDollarValue ?? new Fraction(0),
                  currency,
                )}{" "}
                ({formatSharePercent(newSharePercent)})
              </span>
            </InfoRow>
            {estimatedMint && (
              <>
                <InfoRow>
                  <label>Estimated LP tokens received</label>
                  <TokenAmountDisplay
                    amount={estimatedMint.mintAmount}
                    showIcon
                  />
                </InfoRow>
              </>
            )}
          </Info>
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
            <AsyncButton
              size="large"
              onClick={async () => {
                await handleDeposit(saber);
                onSuccess?.();
                modalProps.onDismiss();
              }}
            >
              Confirm Deposit
            </AsyncButton>
          </ModalBottom>
        </>
      ) : (
        renderConnectWalletButton()
      )}
    </Modal>
  );
};

const Estimate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  label {
    color: ${({ theme }) => theme.colors.text.default};
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    margin-bottom: 8px;
  }

  span {
    font-weight: bold;
    font-size: 36px;
    line-height: 43px;
    color: ${({ theme }) => theme.colors.text.bold};
  }
`;

const Info = styled.div`
  display: grid;
  grid-template-columns: 100%;
  grid-auto-flow: row;
  grid-row-gap: 12px;
  margin: 72px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.text.bold};
  label {
    font-weight: normal;
    font-size: 13px;
    line-height: 16px;
    color: ${({ theme }) => theme.colors.text.default};
  }
`;

const DepositCurrencies = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 8px;
  div {
    justify-self: end;
  }
`;
