import React from "react";
import { styled } from "twin.macro";

import type { IProps as ITokenAmountDisplayProps } from "./TokenAmountDisplay";
import { TokenAmountDisplay } from "./TokenAmountDisplay";

interface IProps
  extends Pick<ITokenAmountDisplayProps, "showIcon" | "isMonoNumber"> {
  tokenAmounts: Pick<ITokenAmountDisplayProps, "amount" | "percent">[];
}

export const StackedTokenAmounts: React.FC<IProps> = ({
  tokenAmounts,
  ...otherProps
}: IProps) => {
  return (
    <StackWrapper>
      {tokenAmounts.map(({ amount, ...rest }) => (
        <TokenAmountDisplay
          key={amount.token.address}
          amount={amount}
          {...otherProps}
          {...rest}
        />
      ))}
    </StackWrapper>
  );
};

const StackWrapper = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 8px;
  div {
    justify-self: end;
  }
`;
