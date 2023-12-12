import { formatNetwork } from "@saberhq/solana-contrib";
import type { Token } from "@saberhq/token-utils";
import React from "react";
import { styled } from "twin.macro";

import { TokenIcon } from "../TokenIcon";

interface Props {
  token: Token;
  link?: boolean;
}

export const TokenInfo: React.FC<Props> = ({ token, link = false }: Props) => {
  const inner = (
    <>
      {token ? <TokenIcon size={32} token={token} /> : <div />}
      <TokenMeta>
        <TokenSymbol>{token?.symbol}</TokenSymbol>
        <TokenName>{token?.name}</TokenName>
      </TokenMeta>
    </>
  );
  return (
    <TokenInfoWrapper>
      {link ? (
        <a
          tw="contents"
          href={`https://tokendao.so/tokens/${formatNetwork(token.network)}/${
            token.address
          }`}
          target="_blank"
          rel="noreferrer"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </TokenInfoWrapper>
  );
};

const TokenInfoWrapper = styled.div`
  display: grid;
  grid-column-gap: 8px;
  grid-template-columns: 32px 1fr;
  align-items: center;
`;

const TokenMeta = styled.div``;

const TokenSymbol = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 16.71px;
  color: ${({ theme }) => theme.colors.text.bold};
`;

const TokenName = styled.div`
  font-size: 12px;
  line-height: 14.32px;
  margin-top: 1px;

  color: ${({ theme }) => theme.colors.text.default};
`;
