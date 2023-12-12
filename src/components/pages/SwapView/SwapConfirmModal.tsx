/* eslint-disable jsx-a11y/label-has-associated-control */
import type { Trade } from "@saberhq/saber-periphery";
import React from "react";
import { css, styled } from "twin.macro";

import { useSettings } from "../../../contexts/settings";
import { AsyncButton } from "../../common/AsyncButton";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import type { ModalProps as IModalProps } from "../../common/Modal";
import { Modal } from "../../common/Modal";
import { Slippage } from "../../common/Slippage";
import { StackedTokenAmounts } from "../../common/StackedTokenAmounts";
import { TokenAmountDisplay } from "../../common/TokenAmountDisplay";

interface IProps extends Omit<IModalProps, "children" | "title"> {
  handleSwap: () => Promise<void>;
  trade?: Trade;
  onSuccess?: () => void;
}

export const SwapConfirmModal: React.FC<IProps> = ({
  handleSwap,
  trade,
  onSuccess,
  ...modalProps
}: IProps) => {
  const { maxSlippagePercent } = useSettings();
  return (
    <Modal title="Review Swap" {...modalProps}>
      <Estimate>
        <label>Estimated Received</label>
        <span>
          {trade?.outputAmount ? (
            <TokenAmountDisplay
              amount={trade.outputAmount}
              numberFormatOptions={{ minimumSignificantDigits: 3 }}
            />
          ) : (
            <LoadingSpinner />
          )}
        </span>
      </Estimate>
      {trade ? (
        // This should always be true
        <Info>
          <InfoRow>
            <label>Swap from</label>
            <span>
              <TokenAmountDisplay
                amount={trade.inputAmount}
                showIcon
                numberFormatOptions={{
                  minimumSignificantDigits: 3,
                }}
              />
            </span>
          </InfoRow>
          <InfoRow>
            <label>Minimum Received</label>
            <span>
              <TokenAmountDisplay
                amount={trade.minimumAmountOut(maxSlippagePercent)}
                showIcon
                numberFormatOptions={{
                  minimumSignificantDigits: 3,
                }}
              />
            </span>
          </InfoRow>
          <InfoRow>
            <label>Exchange Rate</label>
            <span>
              1 {trade.inputAmount.token.symbol} ={" "}
              {trade.executionPrice?.toFixed(4) ?? <LoadingSpinner />}{" "}
              {trade.outputAmount.token.symbol}
            </span>
          </InfoRow>
          <InfoRow>
            <label>Price Impact</label>
            <Slippage value={trade.priceImpact} />
          </InfoRow>
          <InfoRow>
            <label>Liquidity Provider Fee</label>
            <span>
              <StackedTokenAmounts
                showIcon
                tokenAmounts={trade.fees
                  .filter((f) => !f.isZero())
                  .map((fee) => ({
                    amount: fee,
                  }))}
              />
            </span>
          </InfoRow>
        </Info>
      ) : (
        <></>
      )}
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
            await handleSwap();
            modalProps.onDismiss();
            onSuccess?.();
          }}
          disabled={trade?.outputAmount === undefined}
        >
          {trade?.outputAmount ? "Confirm Trade" : "Loading..."}
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
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.text.bold};
  label {
    font-weight: normal;
    font-size: 13px;
    line-height: 16px;
    color: ${({ theme }) => theme.colors.text.default};
  }
`;
