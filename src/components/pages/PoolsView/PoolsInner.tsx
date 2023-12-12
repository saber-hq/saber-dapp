import { useConnectedWallet } from "@saberhq/use-solana";
import Fuse from "fuse.js";
import { groupBy } from "lodash-es";
import React, { useDeferredValue, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { css, styled } from "twin.macro";

import { CurrencyMarket } from "../../../utils/currencies";
import { useAllPoolsWithUserBalances } from "../../../utils/exchange/useAllPoolsWithUserBalances";
import { useTVL } from "../../../utils/exchange/useTVL";
import { formatCurrencyWhole } from "../../../utils/format";
import { InfoCard } from "../../common/cards/InfoCard";
import { EmptyState } from "../../common/EmptyState";
import { TextInput } from "../../common/inputs/TextInput";
import { LoadingPage } from "../../common/LoadingPage";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { NavPills } from "../../common/NavPills";
import {
  PageTitleText,
  PageWidthContainer,
} from "../../layout/MainLayout/PageLayout";
import { PoolCard } from "./PoolCard";
import { VirtualizedPoolList } from "./VirtualizedPoolList";

const KNOWN_GROUPS = [
  CurrencyMarket.USD,
  CurrencyMarket.BTC,
  CurrencyMarket.SOL,
];

export const PoolsInner: React.FC = () => {
  const wallet = useConnectedWallet();
  const { tvlUSD, loading: tvlLoading } = useTVL();
  const { pools: allPoolsWithHidden } = useAllPoolsWithUserBalances();
  const { currency: currencyParam = "usd" } = useParams<"currency">();

  const [query, setQuery] = useState<string>("");
  const queryDebounced = useDeferredValue(query);

  const fuse = useMemo(
    () =>
      new Fuse(allPoolsWithHidden, {
        keys: [
          {
            name: "pool.underlyingIcons.symbol",
            weight: 10,
          },
          "pool.name",
          "pool.lpToken.symbol",
          "pool.underlyingIcons.info.extensions.source",
          "pool.underlyingIcons.name",
        ],
        threshold: 0.6,
      }),
    [allPoolsWithHidden],
  );

  const pools = useMemo(
    () =>
      queryDebounced
        ? fuse.search(queryDebounced).map((r) => r.item)
        : allPoolsWithHidden,
    [allPoolsWithHidden, fuse, queryDebounced],
  );

  const { currency, userPools, groupedPools, filteredPools } = useMemo(() => {
    const userPools = pools.filter(
      (pool) => pool.userBalance && !pool.userBalance?.isZero(),
    );

    const currentCurrency = currencyParam
      ? currencyParam
      : userPools.length && wallet
        ? "my-pools"
        : "USD";

    const groupedPools = groupBy(pools, (pool) => {
      return KNOWN_GROUPS.includes(pool.pool.currency)
        ? pool.pool.currency
        : "OTHER";
    });

    const filteredPools = groupedPools[currentCurrency.toUpperCase()] ?? [];

    return {
      currency: currentCurrency,
      userPools,
      groupedPools,
      filteredPools,
    };
  }, [pools, currencyParam, wallet]);

  const tvlNode = (
    <TVL>
      TVL:{" "}
      {tvlLoading ? (
        <LoadingSpinner
          css={css`
            margin-left: 4px;
          `}
        />
      ) : tvlUSD ? (
        formatCurrencyWhole(parseFloat(tvlUSD.toFixed(2)), CurrencyMarket.USD)
      ) : (
        "--"
      )}
    </TVL>
  );

  const poolLinks = Object.keys(groupedPools)
    .map((currency) => ({
      title: currency,
      href: `/currencies/${currency.toLowerCase()}`,
    }))
    .sort((a, b) => {
      if (a.title === "SOL") {
        return -1;
      }
      if (b.title === "SOL") {
        return 1;
      }
      if (a.title === "OTHER") {
        return 1;
      }
      if (b.title === "OTHER") {
        return -1;
      }
      return a.title.localeCompare(b.title);
    });

  const allPoolLinks = [
    ...(userPools.length && wallet
      ? [
          {
            title: "My Pools",
            href: "/currencies/my-pools",
          },
        ]
      : []),
    ...poolLinks,
  ];

  return (
    <>
      <PageWidthContainer tw="grid gap-6">
        <PageTitleText>Pools</PageTitleText>
        <InfoCard>
          <h2>Vote for your favorite pools</h2>
          <p>
            Vote for SBR liquidity mining rewards distribution with veSBR. Gauge
            weights determine how much of the daily SBR inflation each farm will
            receive.
          </p>
          <a
            href="https://tribeca.so/gov/sbr/gauges"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>Vote on Tribeca</span>
            <FaExternalLinkAlt />
          </a>
        </InfoCard>
        {tvlNode}
        <div tw="flex items-center justify-between">
          <div tw="flex items-center justify-between flex-shrink bg-saberGray-tertiary rounded py-2 px-4 gap-2 focus-within:(ring-1 ring-gray-500)">
            <TextInput
              tw="focus:ring-0 p-0"
              type="text"
              placeholder="Filter by symbol"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            <FaSearch />
          </div>
        </div>
        {pools.length === 0 ? (
          <EmptyState message={"No pools found"} />
        ) : (
          <CardsContainer>
            {query !== "" ? (
              <VirtualizedPoolList pools={pools} />
            ) : (
              <>
                {userPools.length + filteredPools.length === 0 ||
                (currency !== "my-pools" && filteredPools.length === 0) ? (
                  <LoadingPage />
                ) : (
                  <>
                    <NavPills
                      prefix="pools"
                      links={allPoolLinks}
                      css={css`
                        margin-bottom: 16px;
                      `}
                    />
                    {currency === "my-pools" && wallet
                      ? userPools.map((pool) => (
                          <PoolCard
                            key={pool.id}
                            tw="mb-6"
                            poolID={pool.id}
                            pool={pool.pool}
                            showBalance
                          />
                        ))
                      : filteredPools.map((pool) => (
                          <PoolCard
                            key={pool.id}
                            tw="mb-6"
                            poolID={pool.id}
                            pool={pool.pool}
                          />
                        ))}
                  </>
                )}
              </>
            )}
          </CardsContainer>
        )}
      </PageWidthContainer>
    </>
  );
};

const CardsContainer = styled.div`
  display: grid;
  grid-row-gap: 24px;
`;

const TVL = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.bold};
`;
