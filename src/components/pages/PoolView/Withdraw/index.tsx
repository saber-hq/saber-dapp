import type { Theme } from "@emotion/react";
import { useConnectedWallet } from "@saberhq/use-solana";
import React, { useState } from "react";
import invariant from "tiny-invariant";
import { css, styled } from "twin.macro";

import { IWithdrawalMode, useSettings } from "../../../../contexts/settings";
import { useSwappableTokens } from "../../../../contexts/swappableTokens";
import { useConnectWallet } from "../../../../contexts/wallet";
import { useStableSwapTokens } from "../../../../utils/useStableSwapTokens";
import { Button } from "../../../common/Button";
import { BigNumericInput } from "../../../common/inputs/BigNumericInput";
import { SliderInput } from "../../../common/inputs/SliderInput";
import { TokenAmountSelector } from "../../../common/TokenAmountSelector";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";
import { useWithdrawState } from "./useWithdrawState";
import { WithdrawalConfirmModal } from "./WithdrawalConfirmModal";

export const Withdraw: React.FC = () => {
  const wallet = useConnectedWallet();
  const connect = useConnectWallet();
  const { underlyingTokens } = useStableSwapTokens();

  const {
    wrappedTokens,
    estimates,
    withdraw,
    maxWithdrawAmounts,

    withdrawPercentage,
    setWithdrawPercentage,
    withdrawToken,
    setWithdrawToken,
  } = useWithdrawState();

  const { withdrawDisabledReason, slippages } = withdraw;
  const { withdrawalMode, setWithdrawalMode } = useSettings();

  const [isWithdrawalModalOpen, setWithdrawalModalOpen] =
    useState<boolean>(false);

  const selectedTokenIndex =
    wrappedTokens.findIndex((tok) => withdrawToken?.equals(tok)) ?? -1;

  const { swappableTokens } = useSwappableTokens();

  return (
    <>
      <WithdrawalConfirmModal
        withdraw={withdraw}
        isOpen={isWithdrawalModalOpen}
        onDismiss={() => setWithdrawalModalOpen(false)}
        onSuccess={() => {
          setWithdrawPercentage("0.00");
        }}
      />
      <InnerContainer noPad>
        <SliderWrapper>
          <div>
            <span>Select the percentage of your position to withdraw:</span>
          </div>
          <Slider>
            <BigNumericInput
              value={withdrawPercentage + "%"}
              disabled
              hasBackground
              css={(theme: Theme) => css`
                font-size: 18px;
                &:disabled {
                  color: ${theme.colors.text.bold};
                }
              `}
            />
            <SliderInput
              type="range"
              min={0}
              max={100}
              value={withdrawPercentage}
              onChange={(e) => setWithdrawPercentage(e.target.value)}
            />
          </Slider>
        </SliderWrapper>
        {withdrawalMode === IWithdrawalMode.ALL ? (
          <Currencies>
            {wrappedTokens?.map((token, i) => (
              <CurrencyWrapper key={token.value.address}>
                <TokenAmountSelector
                  tokens={swappableTokens}
                  selectedValue={token.underlying}
                  inputValue={estimates[i]?.format() ?? ""}
                  inputDisabled
                  inputOnChange={() => {
                    setWithdrawToken(token);
                    setWithdrawalMode(IWithdrawalMode.ONE);
                    setWithdrawPercentage("100.00");
                  }}
                  currentAmount={{
                    amount: maxWithdrawAmounts[i]?.withdrawAmount,
                    label: "Max Withdrawal",
                    allowSelect: true,
                  }}
                />
              </CurrencyWrapper>
            ))}
          </Currencies>
        ) : (
          <CurrencyWrapper>
            <TokenAmountSelector
              tokens={underlyingTokens ?? []}
              selectedValue={withdrawToken?.underlying ?? null}
              onSelect={(tok) => {
                const wrappedToken = wrappedTokens?.find((t) =>
                  t.underlying.equals(tok),
                );
                invariant(wrappedToken, "tok not found");
                setWithdrawToken(wrappedToken);
              }}
              inputOnChange={() => {
                setWithdrawalMode(IWithdrawalMode.ONE);
                setWithdrawPercentage("100.00");
              }}
              inputValue={estimates[selectedTokenIndex]?.format() ?? ""}
              inputDisabled
              currentAmount={{
                amount: maxWithdrawAmounts[selectedTokenIndex]?.withdrawAmount,
                label: "Max Withdrawal",
                allowSelect: true,
              }}
              slippage={slippages[selectedTokenIndex]}
            />
          </CurrencyWrapper>
        )}
        <WithdrawButton>
          {!wallet ? (
            <Button size="large" variant="secondary" onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <Button
              size="large"
              disabled={withdrawDisabledReason !== undefined}
              variant={
                withdrawDisabledReason === "Price impact too high"
                  ? "danger"
                  : undefined
              }
              onClick={() => {
                setWithdrawalModalOpen(true);
              }}
            >
              {withdrawDisabledReason ?? "Withdraw"}
            </Button>
          )}
        </WithdrawButton>
      </InnerContainer>
    </>
  );
};

const WithdrawButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const CurrencyWrapper = styled.div`
  padding: 24px;
`;

const Currencies = styled.div`
  ${CurrencyWrapper}:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
`;

const Slider = styled.div`
  height: 48px;
  display: grid;
  grid-template-columns: 135px 1fr;
`;

const SliderWrapper = styled.div`
  display: grid;
  grid-row-gap: 24px;
  grid-auto-flow: row;
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
`;
