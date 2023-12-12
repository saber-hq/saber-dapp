/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
import type { Theme } from "@emotion/react";
import BN from "bn.js";
import { groupBy, partition } from "lodash-es";
import React, { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { css, styled } from "twin.macro";

import { usePrices } from "../../../contexts/prices";
import { ALDRIN_LINK, SABER_QUARRY_LINK } from "../../../utils/constants";
import { CurrencyMarket } from "../../../utils/currencies";
import { useAllPlots } from "../../../utils/farming/useAllPlots";
import { formatCurrencySmart } from "../../../utils/format";
import { CardsContainer } from "../../common/cards/CardsContainer";
import { QuarryInfoCard } from "../../common/cards/QuarryInfoCard";
import { LoadingPage } from "../../common/LoadingPage";
import { NavPills } from "../../common/NavPills";
import { MainLayout } from "../../layout/MainLayout";
import { SubSection } from "../../layout/SubLayout/SubSection";
import { FarmCard } from "./FarmCard";
import { MyFarms } from "./MyFarms";

const ZERO = new BN(0);

export const FarmsViewInner: React.FC = () => {
  const { loading, plots } = useAllPlots();
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const { currency } = useParams<"currency">();

  const { data: prices } = usePrices();
  const sbrPriceUSD = prices?.saber;

  const [stakedPlots, otherPlots] = partition(
    plots,
    (p) => p.minerData && p.minerData.account.balance.gt(ZERO),
  );

  const [activePlots, inactivePlots] = partition(
    otherPlots,
    (plot) => loading || plot.quarry?.quarry.account.annualRewardsRate.gt(ZERO),
  );

  const groupedPlots = groupBy(activePlots, (pool) =>
    pool.pool.currency === CurrencyMarket.USD ||
    pool.pool.currency === CurrencyMarket.BTC ||
    pool.pool.currency === CurrencyMarket.SOL
      ? pool.pool.currency
      : "OTHER",
  );
  const filteredActivePlots = currency
    ? groupedPlots[currency.toUpperCase()] ?? []
    : [];

  return (
    <MainLayout title="Farms" hideOptions>
      <QuarryInfoCard
        title="Multi rewards yield farming available on Quarry Protocol!"
        link={SABER_QUARRY_LINK}
        ctaText="Farm SBR on Quarry"
      />
      <Links>
        <LastPrice>
          Last SBR Price:{" "}
          {sbrPriceUSD
            ? formatCurrencySmart(sbrPriceUSD, CurrencyMarket.USD, {
                minimumFractionDigits: 5,
              })
            : "--"}
        </LastPrice>
        <a
          css={(theme: Theme) => css`
            font-size: 12px;
            display: flex;
            align-items: center;
            svg {
              margin-left: 4px;
            }
            text-decoration: underline;
            color: ${theme.colors.text.default};
            &:hover {
              color: ${theme.colors.text.accent};
            }
          `}
          href={ALDRIN_LINK}
          target="_blank"
          rel="noreferrer"
        >
          <span>View on Aldrin</span>
          <FaExternalLinkAlt />
        </a>
      </Links>
      {plots.length === 0 &&
        (loading ? (
          <LoadingPage />
        ) : (
          <p
            css={css`
              font-size: 16px;
            `}
          >
            There are no farms available.
          </p>
        ))}
      {activePlots.length > 0 && (
        <SubSection title="Active Farms">
          <NavPills
            prefix="farms"
            links={[
              {
                title: "My Farms",
                href: "/my-farms",
              },
              ...Object.keys(groupedPlots).map((currency) => ({
                title: currency,
                href: `/${currency.toLowerCase()}`,
              })),
            ]}
            css={css`
              margin-bottom: 16px;
            `}
          />
          <CardsContainer>
            {currency === "my-farms" ? (
              <MyFarms myPlots={stakedPlots} loading={loading} />
            ) : (
              filteredActivePlots.map((info) => (
                <FarmCard key={info.poolID} info={info} />
              ))
            )}
          </CardsContainer>
        </SubSection>
      )}
      {inactivePlots.length > 0 &&
        (showInactive ? (
          <SubSection title="Inactive Farms">
            <CardsContainer>
              {inactivePlots
                .filter((p) => p.quarry !== null)
                .map((info) => (
                  <FarmCard key={info.poolID} info={info} />
                ))}
              <a
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowInactive(false);
                }}
              >
                Hide inactive farms
              </a>
            </CardsContainer>
          </SubSection>
        ) : (
          <a
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowInactive(true);
            }}
          >
            Show {inactivePlots.length} inactive farms
          </a>
        ))}
    </MainLayout>
  );
};

const Links = styled.div`
  display: flex;
  justify-content: space-between;
`;

const LastPrice = styled.span`
  color: ${({ theme }) => theme.colors.text.bold};
  font-size: 16px;
`;
