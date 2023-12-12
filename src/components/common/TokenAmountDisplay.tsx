import type { IFormatUint, Percent, TokenAmount } from "@saberhq/token-utils";
import React from "react";
import { css, styled } from "twin.macro";

import { formatPercent, formatTokenWithSoftLimit } from "../../utils/format";
import { TokenIcon } from "./TokenIcon";

export interface IProps extends IFormatUint {
  amount: TokenAmount;
  isMonoNumber?: boolean;
  showIcon?: boolean;
  percent?: Percent;
  className?: string;
  showSymbol?: boolean;
  softMaximumSignificantDigits?: number;
  numberFormatOptions?: Intl.NumberFormatOptions;
}

/**
 * @param softMaximumSignificantDigits See formatTokenWithSoftLimit() in format.ts
 */
export const TokenAmountDisplay: React.FC<IProps> = ({
  amount,
  isMonoNumber = false,
  showIcon = false,
  showSymbol = true,
  softMaximumSignificantDigits = 7,
  percent,
  className,
  locale = "en-US",
  numberFormatOptions = {},
}: IProps) => {
  return (
    <TokenAmountWrapper className={className}>
      {showIcon && (
        <TokenIcon
          css={css`
            margin-right: 4px;
          `}
          token={amount.token}
        />
      )}
      <TheNumber isMonoNumber={isMonoNumber}>
        {formatTokenWithSoftLimit(
          amount,
          softMaximumSignificantDigits,
          numberFormatOptions,
          locale,
        )}
      </TheNumber>
      {showSymbol && <span>{amount.token.symbol}</span>}
      {percent && <PercentFmt>({formatPercent(percent)})</PercentFmt>}
    </TokenAmountWrapper>
  );
};

const PercentFmt = styled.span`
  margin-left: 4px;
`;

const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const TheNumber = styled.span<{ isMonoNumber?: boolean }>`
  ${({ theme, isMonoNumber }) =>
    isMonoNumber === true
      ? css`
          ${theme.mono}
        `
      : undefined}
  margin-right: 4px;
`;
