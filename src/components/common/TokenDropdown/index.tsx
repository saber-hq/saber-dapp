import type { Token } from "@saberhq/token-utils";
import React, { useState } from "react";
import { FaSort } from "react-icons/fa";
import { css, styled } from "twin.macro";

import { TokenIcon } from "../TokenIcon";

const SelectTokenModal = React.lazy(() => import("./SelectTokenModal"));

interface IProps {
  tokens: readonly Token[];
  token: Token | null;
  onChange?: (token: Token) => void;
  allowArbitraryMint?: boolean;
}

export const TokenDropdown: React.FC<IProps> = ({
  tokens,
  token,
  onChange,
  allowArbitraryMint,
}: IProps) => {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  return (
    <>
      {onChange && (
        <SelectTokenModal
          tokens={tokens}
          selectedToken={token ?? undefined}
          onSelect={(t) => {
            onChange(t);
            setShowDropdown(false);
          }}
          isOpen={showDropdown}
          onDismiss={() => setShowDropdown(false)}
          allowArbitraryMint={allowArbitraryMint}
        />
      )}
      <Selector
        isStatic={onChange === undefined}
        onClick={onChange ? () => setShowDropdown(true) : undefined}
      >
        {token ? <TokenIcon size={32} token={token} /> : <div />}
        <TokenInfo>
          <TokenSymbol>{token?.symbol}</TokenSymbol>
          <TokenName>{token?.name}</TokenName>
        </TokenInfo>
        {onChange && <FaSort />}
      </Selector>
    </>
  );
};

const TokenInfo = styled.div`
  width: 100%;
  max-width: 100%;
`;

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

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  color: ${({ theme }) => theme.colors.text.default};
`;

const Selector = styled.div<{ isStatic?: boolean }>`
  transition: 0.1s ease;
  user-select: none;
  background: ${({ theme }) => theme.colors.cryptoselector.base.default};
  ${({ isStatic, theme }) =>
    isStatic !== true &&
    css`
      cursor: pointer;
      &:hover {
        background: ${theme.colors.cryptoselector.base.hover};
      }
    `}
  height: 48px;
  display: grid;
  grid-column-gap: 8px;
  grid-template-columns: 32px calc(100% - 32px - 8px - 8px - 8px) 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  width: 180px;
  max-width: 180px;
  border-radius: 16px;
  & > svg {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`;
