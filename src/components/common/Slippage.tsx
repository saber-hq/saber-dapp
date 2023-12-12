import { Fraction, Percent } from "@saberhq/token-utils";
import React from "react";
import { styled } from "twin.macro";

import { formatPercent } from "../../utils/format";

interface IProps {
  className?: string;
  value: Percent;
  showParens?: boolean;
}

export const Slippage: React.FC<IProps> = ({
  value,
  className,
  showParens,
}: IProps) => {
  const slippageStr = value.lessThan(new Fraction(-1, 100_000))
    ? `+${formatPercent(value.multiply(-1))}`
    : value.isZero()
      ? "0.00%"
      : value.asFraction.lessThan(new Fraction(1, 10_000))
        ? "<0.01%"
        : formatPercent(value);
  return (
    <SlippageWrapper className={className} value={value}>
      {showParens ? `(${slippageStr})` : slippageStr}
    </SlippageWrapper>
  );
};

const SlippageWrapper = styled.span<{ value: Percent }>`
  margin-left: 3px;
  color: ${({ theme, value }) =>
    value.lessThan(new Percent(1, 100))
      ? theme.colors.text.green
      : value.lessThan(new Percent(3, 100))
        ? theme.colors.text.orange
        : theme.colors.text.red};
`;
