/* eslint-disable jsx-a11y/label-has-associated-control */
import type { TokenAmount } from "@saberhq/token-utils";
import { Fraction, Percent } from "@saberhq/token-utils";
import React from "react";
import { css, styled } from "twin.macro";

import {
  formatSharePercent,
  useUserPoolShare,
} from "../../../../utils/exchange/useUserPoolShare";
import type { IUseWithdraw } from "../../../../utils/exchange/useWithdraw";
import { formatCurrencySmart } from "../../../../utils/format";
import { useStableSwap } from "../../../../utils/useStableSwap";
import { AsyncButton } from "../../../common/AsyncButton";
import type { ModalProps as IModalProps } from "../../../common/Modal";
import { Modal } from "../../../common/Modal";
import { Slippage } from "../../../common/Slippage";
import { TokenAmountDisplay } from "../../../common/TokenAmountDisplay";

interface IProps extends Omit<IModalProps, "children" | "title"> {
  withdraw: IUseWithdraw;
  onSuccess?: () => void;
}

export const WithdrawalConfirmModal: React.FC<IProps> = ({
  withdraw,
  onSuccess,
  ...modalProps
}: IProps) => {
  const { currency, virtualPrice } = useStableSwap();
  const {
    handleWithdraw,
    estimates,
    fees,
    feePercents,
    poolTokenAmount,
    slippages,
    withdrawToken,
  } = withdraw;
  const { total, lpTokenBalance } = useUserPoolShare();
  const removedCurrencyValue = estimates
    .filter((e): e is TokenAmount => e !== undefined)
    .map((amt) => amt.asFraction)
    .reduce((acc, el) => acc.add(el), new Fraction(0, 1));

  const newShare =
    lpTokenBalance &&
    poolTokenAmount &&
    poolTokenAmount.lessThan(lpTokenBalance)
      ? lpTokenBalance.subtract(poolTokenAmount)
      : undefined;
  const newCurrencyValue = virtualPrice
    ? newShare?.multiply(virtualPrice)
    : undefined;
  const newShareFraction = total
    ? newCurrencyValue?.divide(total.subtract(removedCurrencyValue))
    : undefined;
  const newSharePercent = newShareFraction
    ? new Percent(newShareFraction.numerator, newShareFraction.denominator)
    : undefined;

  return (
    <Modal title="Review Withdrawal" {...modalProps}>
      <Estimate>
        <label>Total Withdrawal</label>
        <span>{formatCurrencySmart(removedCurrencyValue, currency)}</span>
      </Estimate>
      <Info>
        <InfoRow>
          <label>Withdrawal Currencies</label>
          <DepositCurrencies>
            {estimates
              .filter((amt): amt is TokenAmount => amt !== undefined)
              .map((amt) => (
                <TokenAmountDisplay
                  key={amt.token.address}
                  amount={amt}
                  showIcon
                />
              ))}
          </DepositCurrencies>
        </InfoRow>
        {/* <InfoRow>
          <label>Minimum Received</label>
          <DepositCurrencies>
            {minimums
              .filter((amt): amt is TokenAmount => amt !== undefined)
              .map((amt) => (
                <TokenAmount
                  key={amt.token.address}
                  amount={amt}
                  showIcon
                />
              ))}
          </DepositCurrencies>
        </InfoRow> */}
        {withdrawToken && (
          <InfoRow>
            <label>Price Impact</label>
            <DepositCurrencies>
              {slippages
                .filter((amt): amt is Percent => amt !== undefined)
                .map((amt, i) => {
                  return (
                    <span key={i}>
                      <Slippage value={amt} />
                      {amt.lessThan(0) && <Bonus>(Bonus!)</Bonus>}
                    </span>
                  );
                })}
            </DepositCurrencies>
          </InfoRow>
        )}
        <InfoRow>
          <label>New pool share</label>
          <span>
            {formatCurrencySmart(
              parseFloat(newCurrencyValue?.toFixed(2) ?? "0"),
              currency,
            )}{" "}
            ({formatSharePercent(newSharePercent)})
          </span>
        </InfoRow>
        <InfoRow>
          <label>Fees</label>
          <DepositCurrencies>
            {fees
              .filter((f): f is TokenAmount => !!f)
              .map((fee, i) => (
                <TokenAmountDisplay
                  key={i}
                  amount={fee}
                  percent={
                    feePercents[i]?.denominator.toString() === "0"
                      ? undefined
                      : feePercents[i]
                  }
                  showIcon
                />
              ))}
          </DepositCurrencies>
        </InfoRow>
      </Info>
      <Bottom>
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
            await handleWithdraw();
            onSuccess?.();
            modalProps.onDismiss();
          }}
        >
          Confirm Withdrawal
        </AsyncButton>
      </Bottom>
    </Modal>
  );
};

const Bottom = styled.div`
  display: grid;
  grid-auto-flow: row;
  align-items: center;
  justify-content: center;
  grid-row-gap: 24px;

  font-size: 16px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.text.default};

  text-align: center;
  span {
    display: inline-block;
  }
`;

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

const Bonus = styled.span`
  margin-left: 4px;
`;
