import type { Token } from "@saberhq/token-utils";
import React from "react";
import { styled } from "twin.macro";

import { TokenIcon } from "./TokenIcon";

interface Props {
  tokens: readonly Token[];
  size?: number;
}

export const PoolIcon: React.FC<Props> = ({ tokens, size }: Props) => {
  return (
    <Wrapper>
      {tokens.map((tok) => (
        <TokenIcon size={size ?? 24} key={tok.address} token={tok} />
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  gap: 0;
  align-items: center;
  height: 24px;
`;
