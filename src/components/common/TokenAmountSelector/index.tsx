import { DEFAULT_TOKEN_DECIMALS } from "@saberhq/stableswap-sdk";
import type { Percent, Token } from "@saberhq/token-utils";
import { TokenAmount } from "@saberhq/token-utils";
import React from "react";
import { css, styled } from "twin.macro";

import { BREAKPOINT_SIZES } from "../../../theme/breakpoints";
import {
  CURRENCY_INFO,
  CurrencyMarket,
  getMarket,
} from "../../../utils/currencies";
import { formatCurrencySmart } from "../../../utils/format";
import useWindowDimensions from "../../../utils/useWindowDimensions";
import { BigNumericInput } from "../inputs/BigNumericInput";
import { Slippage } from "../Slippage";
import { TokenAmountDisplay } from "../TokenAmountDisplay";
import { TokenDropdown } from "../TokenDropdown";

interface IProps {
  tokens: readonly Token[];
  onSelect?: (token: Token) => void;
  selectedValue: Token | null;
  inputValue: string;
  inputOnChange?: (val: string) => void;
  slippage?: Percent;
  inputDisabled?: boolean;
  className?: string;

  currentAmount?: {
    amount?: TokenAmount;
    allowSelect?: boolean;
    label?: string;
  };
  currency?: CurrencyMarket;
  hideOutputValue?: boolean;
  allowArbitraryMint?: boolean;
}

/**
 * Selects a token and its amount
 * @param param0
 * @returns
 */
export const TokenAmountSelector: React.FC<IProps> = ({
  tokens,
  onSelect,
  selectedValue,
  inputValue,
  inputOnChange,
  slippage,
  inputDisabled = false,
  currentAmount,
  currency = selectedValue ? getMarket(selectedValue) : CurrencyMarket.USD,
  className,
  hideOutputValue = false,
  allowArbitraryMint,
}: IProps) => {
  const { width } = useWindowDimensions();

  const uiDecimals =
    width < BREAKPOINT_SIZES[0]
      ? 4
      : selectedValue?.decimals ?? DEFAULT_TOKEN_DECIMALS;

  const outputParsed = parseFloat(inputValue);
  const output = Number.isNaN(outputParsed) ? undefined : outputParsed;

  return (
    <TokenBox className={className}>
      <Section>
        <TokenDropdown
          tokens={tokens}
          token={selectedValue}
          onChange={onSelect}
          allowArbitraryMint={allowArbitraryMint}
        />
        <BigNumericInput
          css={css`
            text-align: right;
            width: 50%;
          `}
          placeholder="0.00"
          disabled={inputDisabled}
          value={inputValue}
          onChange={inputOnChange}
        />
      </Section>
      {selectedValue && (
        <Section>
          {currentAmount ? (
            <Balance>
              <span>{currentAmount.label ?? "Balance"}:</span>
              {currentAmount.amount ? (
                <Accent
                  onClick={
                    currentAmount.allowSelect
                      ? () => {
                          inputOnChange?.(
                            currentAmount.amount?.toExact() ?? "0",
                          );
                        }
                      : undefined
                  }
                >
                  <TokenAmountDisplay
                    amount={
                      currentAmount.amount ?? new TokenAmount(selectedValue, 0)
                    }
                    locale="en-US"
                    numberFormatOptions={{
                      minimumFractionDigits: uiDecimals,
                      maximumFractionDigits: uiDecimals,
                    }}
                  />
                </Accent>
              ) : (
                <NoAmount>--</NoAmount>
              )}
            </Balance>
          ) : (
            <div />
          )}
          {!hideOutputValue && (
            <>
              {output ? (
                <Output>
                  ~{formatCurrencySmart(output, currency)}
                  {slippage !== undefined && (
                    <Slippage
                      css={css`
                        margin-left: 3px;
                      `}
                      value={slippage}
                      showParens
                    />
                  )}
                </Output>
              ) : (
                <Output>{CURRENCY_INFO[currency].prefix ?? ""}&mdash;</Output>
              )}
            </>
          )}
        </Section>
      )}
    </TokenBox>
  );
};

const Output = styled.div`
  color: ${({ theme }) => theme.colors.text.default};
`;

const NoAmount = styled.span`
  margin-left: 0.5em;
  color: ${({ theme }) => theme.colors.text.default};
`;

const Accent = styled.span<{ onClick?: () => void }>`
  margin-left: 0.5em;
  color: ${({ theme }) => theme.colors.text.accent};
  ${({ theme }) => theme.mono};
  ${({ onClick }) =>
    onClick !== undefined &&
    css`
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    `}
`;

const Balance = styled.div`
  font-weight: normal;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.default};

  display: flex;
  align-items: center;
`;

const Section = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TokenBox = styled.div`
  display: grid;
  grid-row-gap: 24px;
  grid-auto-flow: row;
`;
