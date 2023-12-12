import type { Price } from "@saberhq/token-utils";
import React, { useEffect, useState } from "react";
import { styled } from "twin.macro";

import { LoadingSpinner } from "../../common/LoadingSpinner";
import { ReactComponent as SwapIcon } from "./SwapIcon.svg";

interface IProps {
  loading?: boolean;
  price: Price | null;
}

export const ExchangeRate: React.FC<IProps> = ({ loading, price }: IProps) => {
  const [invert, setInvert] = useState<boolean>(false);

  useEffect(() => {
    setInvert(false);
  }, [price?.baseCurrency, price?.quoteCurrency]);

  const rate = invert ? price?.invert() : price;

  return (
    <Wrapper>
      <TheLabel>
        <SwapIcon />
        <span>Exchange Rate</span>
      </TheLabel>
      <Inner
        onClick={() => {
          setInvert(!invert);
        }}
      >
        {!loading && !rate ? (
          <NoRoute key="noRoute">No route found</NoRoute>
        ) : (
          renderExchangeRate(loading, rate)
        )}
      </Inner>
    </Wrapper>
  );
};

const renderExchangeRate = (
  loading: boolean | undefined,
  rate: Price | null | undefined,
) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <span key="rate">
      1 {rate?.baseCurrency.symbol} = {rate ? rate.toFixed(4) : "--"}{" "}
      {rate?.quoteCurrency.symbol}
    </span>
  );
};

const TheLabel = styled.div`
  display: grid;
  grid-column-gap: 8.75px;
  grid-auto-flow: column;
  align-items: center;
  & > svg {
    height: 12px;
  }
`;

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.base.tertiary};
  height: 48px;

  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  padding: 0 24px;
  color: ${({ theme }) => theme.colors.text.default};
  border-radius: 0px 0px 8px 8px;
`;

const Inner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.bold};
  cursor: pointer;

  gap: 8px;
  & > svg {
    color: ${({ theme }) => theme.colors.text.default};
  }
`;

const NoRoute = styled.span`
  color: ${({ theme }) => theme.colors.text.muted};
`;
