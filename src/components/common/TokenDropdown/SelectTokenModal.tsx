import { SBR_MINT } from "@saberhq/saber-periphery";
import { usePubkey, useToken, useUserATAs } from "@saberhq/sail";
import type { Token, TokenAmount } from "@saberhq/token-utils";
import Fuse from "fuse.js";
import { groupBy } from "lodash-es";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FixedSizeList, ListChildComponentProps } from "react-window";
import { FixedSizeList as List } from "react-window";
import tw, { styled } from "twin.macro";

import { useSDK } from "../../../contexts/sdk";
import { DUMMY_TOKEN } from "../../../utils/constants";
import { rawSOLOverride } from "../../../utils/rawSOL";
import { LoadingSpinner } from "../LoadingSpinner";
import type { ModalProps as IModalProps } from "../Modal";
import { Modal } from "../Modal";
import { TokenResult } from "./TokenResult";
import { TokenResultWithBalance } from "./TokenResultWithBalance";

type Props = Omit<IModalProps, "children" | "title"> & {
  tokens: readonly Token[];
  selectedToken?: Token;
  onSelect?: (token: Token) => void;
  allowArbitraryMint?: boolean;
};

export const SelectTokenModal: React.FC<Props> = ({
  tokens,
  onSelect,
  allowArbitraryMint = false,
  ...modalProps
}: Props) => {
  const { saber } = useSDK();
  const provider = saber?.provider;

  const [query, setQuery] = useState<string>("");

  // Result of looking up a mint account by its address.
  const queryKey = usePubkey(query);
  const { data: token } = useToken(queryKey);

  const userTokenAccounts = useUserATAs(...tokens.map(rawSOLOverride));

  const tokensWithBalances = useMemo((): {
    token: Token;
    balance?: TokenAmount;
  }[] => {
    if (
      !userTokenAccounts.every((uta) => uta !== undefined) ||
      userTokenAccounts.length === 0
    ) {
      return tokens.map((token) => ({
        token,
      }));
    }
    const grouped = groupBy(
      userTokenAccounts,
      (uta) => uta?.balance.token.address,
    );
    return tokens
      .filter(
        (tok) =>
          !tok.equals(DUMMY_TOKEN) &&
          tok.address !== SBR_MINT &&
          tok.address !== "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT", // XXX(michasel):  CASH pools are paused
      )
      .map((token) => {
        const ta = grouped[token.address]?.[0];
        if (ta && ta.balance.greaterThan(0)) {
          return {
            token,
            balance: ta.balance,
          };
        }
        return { token };
      })
      .sort((a, b) => {
        if (a.balance && !b.balance) {
          return -1;
        }
        if (b.balance && !a.balance) {
          return 1;
        }
        return a.token.symbol.localeCompare(b.token.symbol);
      });
  }, [tokens, userTokenAccounts]);

  const fuse = useMemo(
    () =>
      new Fuse(tokensWithBalances, {
        keys: ["token.name", "token.symbol"],
      }),
    [tokensWithBalances],
  );

  const result = query
    ? fuse.search(query).map((r) => r.item)
    : tokensWithBalances;

  const listRef = useRef<FixedSizeList>(null);
  useEffect(() => {
    listRef.current?.scrollTo(0);
  }, [query]);

  let results = null;
  if (
    queryKey &&
    token === undefined &&
    provider !== null &&
    allowArbitraryMint
  ) {
    results = (
      <LoadingSpinnerContainer>
        <LoadingSpinner />
      </LoadingSpinnerContainer>
    );
  } else if (token && allowArbitraryMint) {
    results = [
      <TokenResultWithBalance
        key={token.address}
        onSelect={onSelect}
        token={token}
      />,
    ];
  } else if (result.length > 0) {
    const Row = ({ index, style }: ListChildComponentProps) => {
      const token = result[index];
      if (!token) {
        // should not happen
        return <div />;
      }
      return (
        <TokenResult
          style={style}
          onSelect={onSelect}
          token={token.token}
          userTokenAccounts={userTokenAccounts}
        />
      );
    };

    results = (
      <List
        ref={listRef}
        height={(window.innerHeight * 6) / 10}
        itemCount={result.length}
        itemSize={60}
        width="100%"
      >
        {Row}
      </List>
    );
  } else {
    results = <NoResults>No results</NoResults>;
  }

  const placeholder = allowArbitraryMint
    ? "Search for token or paste address"
    : "Search for token";

  return (
    <Modal title="Select a token" {...modalProps}>
      <SearchInput
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        placeholder={placeholder}
      />
      <Results>{results}</Results>
    </Modal>
  );
};

const LoadingSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const NoResults = styled.div`
  font-size: 16px;
`;

const Results = styled.div`
  margin-top: 36px;
  display: grid;
  gap: 4px;
`;

const SearchInput = styled.input`
  caret-color: ${({ theme }) => theme.colors.text.accent};
  color: ${({ theme }) => theme.colors.text.bold};
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  outline: none;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 16px;
  width: 100%;
  ${tw`focus:(outline-none ring-0)`}
`;

export default SelectTokenModal;
