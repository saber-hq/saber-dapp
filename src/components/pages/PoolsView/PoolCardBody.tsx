import { exists } from "@saberhq/solana-contrib";
import { Fraction } from "@saberhq/token-utils";
import React, { useMemo } from "react";
import { styled } from "twin.macro";

import { usePrice } from "../../../contexts/prices";
import { useRouter } from "../../../contexts/router";
import { CurrencyMarket } from "../../../utils/currencies";
import { formatCurrencySmart } from "../../../utils/format";
import type { Pool } from "../../../utils/useEnvironment";
import { LineItem } from "./LineItem";
import { PoolCardUserBody } from "./PoolCardUserBody";

interface Props {
  pool: Pool;
  showBalance: boolean;
}

export const PoolCardBody: React.FC<Props> = ({ pool, showBalance }: Props) => {
  const { exchangeMap } = useRouter();
  const poolInfo = exchangeMap[pool.lpToken.address];
  const { currency } = pool;
  const currencyPrice = usePrice(currency);

  const { tvl, tvlUSD } = useMemo(() => {
    if (!poolInfo || !currency) {
      return { tvl: null, tvlUSD: null };
    }
    const tvl = poolInfo.info.reserves
      .map((r) => r.amount.asFraction)
      .reduce((acc, el) => acc.add(el));
    const tvlUSD =
      (exists(currencyPrice) &&
        tvl.multiply(Fraction.fromNumber(currencyPrice))) ||
      null;
    return { tvl, tvlUSD };
  }, [currency, poolInfo, currencyPrice]);

  return (
    <Wrapper>
      <LineItem label="Total Deposits">
        {tvl && (
          <>
            {formatCurrencySmart(tvl, currency)}
            {currency !== CurrencyMarket.USD &&
              tvlUSD &&
              ` (${formatCurrencySmart(tvlUSD, CurrencyMarket.USD)})`}
          </>
        )}
      </LineItem>
      {showBalance && (
        <PoolCardUserBody
          lpToken={pool.lpToken}
          tvl={tvl}
          tvlUSD={tvlUSD}
          currency={currency}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  font-size: 16px;
`;
