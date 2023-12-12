import { mapN, mapSome } from "@saberhq/solana-contrib";
import { PublicKey } from "@solana/web3.js";
import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import invariant from "tiny-invariant";
import tw, { css, styled } from "twin.macro";

import { CURRENCY_INFO, CurrencyMarket } from "../../../utils/currencies";
import { formatCurrencySmart } from "../../../utils/format";
import { useSourcesInfo } from "../../../utils/metadata/sources";
import { useStableSwap } from "../../../utils/useStableSwap";
import { useStableSwapTokens } from "../../../utils/useStableSwapTokens";
import { generateAnalyticsUrl } from "../../../utils/utils";
import { AttributeList } from "../../common/AttributeList";
import { Flipper } from "../../common/Flipper";
import { StackedTokenAmounts } from "../../common/StackedTokenAmounts";
import { SubLayout } from "../../layout/SubLayout";
import { SourceInfoCard } from "./SourceInfoCard";

export const PoolInfo: React.FC = () => {
  const {
    swap,
    exchangeInfo,
    currency,
    currencyPriceUSD,
    virtualPrice,
    exchange,
  } = useStableSwap();
  const { data: sources } = useSourcesInfo();

  const ampFactor = exchangeInfo?.ampFactor;
  const rampInfo = mapSome(swap, (s) => {
    if (s.state.startRampTimestamp === 0 && s.state.stopRampTimestamp === 0) {
      return null;
    }
    const start = new Date(s.state.startRampTimestamp * 1_000);
    const stop = new Date(s.state.stopRampTimestamp * 1_000);

    const now = new Date();
    if (now >= start && now <= stop) {
      return {
        initialA: s.state.initialAmpFactor,
        targetA: s.state.targetAmpFactor,
        start: start,
        stop: stop,
      };
    }

    return null;
  });

  const { wrappedTokens } = useStableSwapTokens();

  const total = exchangeInfo?.reserves
    .map((r) => r.amount.asFraction)
    .reduce((acc, el) => acc.add(el));
  const totalUSD = mapN(
    (currencyPriceUSD, total) => currencyPriceUSD * total.asNumber,
    currencyPriceUSD,
    total,
  );

  const amounts = total
    ? exchangeInfo?.reserves.map((reserve, i) => {
        const amount = wrappedTokens[i]?.underlyingAmount(reserve.amount);
        invariant(amount, "amount not defined");
        return {
          amount,
          percent: reserve.amount.divideBy(total),
        };
      })
    : undefined;

  const [tokenA, tokenB] = exchange?.tokens ?? [];
  const symbolA = exchange?.tokens[0].symbol ?? "--";
  const symbolB = exchange?.tokens[1].symbol ?? "--";

  const sourceA = mapSome(tokenA, (t) =>
    t.info.extensions?.source
      ? sources?.[t.info.extensions.source.toLowerCase()]
      : null,
  );
  const sourceB = mapSome(tokenB, (t) =>
    t.info.extensions?.source
      ? sources?.[t.info.extensions.source.toLowerCase()]
      : null,
  );

  return (
    <>
      <SubLayout
        title="Pool Stats"
        noPad
        css={css`
          margin-top: 48px;
        `}
        right={
          <a
            href={`${generateAnalyticsUrl(
              swap?.config.swapAccount ?? PublicKey.default,
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            css={css`
              display: flex;
              align-items: center;
            `}
          >
            <span>Analytics</span>
            <FaExternalLinkAlt
              css={css`
                margin-left: 4px;
              `}
            />
          </a>
        }
      >
        <InnerSection>
          <AttributeList
            loading={!swap}
            attributes={{
              "Currency Reserves": amounts ? (
                <StackedTokenAmounts
                  tokenAmounts={amounts.map(({ amount, percent }) => ({
                    amount,
                    percent,
                    numberFormatOptions:
                      CURRENCY_INFO[currency].largeFormat.resolvedOptions(),
                  }))}
                  showIcon
                  isMonoNumber
                />
              ) : undefined,
              "Total Reserves": total ? (
                <>
                  {formatCurrencySmart(total, currency)}
                  {totalUSD && currency !== CurrencyMarket.USD
                    ? ` (${formatCurrencySmart(totalUSD, CurrencyMarket.USD)})`
                    : null}
                </>
              ) : undefined,
            }}
          />
        </InnerSection>
        <InnerSection>
          <AttributeList
            loading={!swap}
            attributes={{
              "Virtual Price": virtualPrice?.toFixed(4),
              "Concentration Coefficient": ampFactor ? (
                <>
                  <span tw="font-semibold text-white">
                    {parseInt(ampFactor.toString()).toLocaleString()}x{" "}
                  </span>
                  <StarPower>
                    <Flipper tw="inline-block w-4">⚡️</Flipper>
                  </StarPower>
                </>
              ) : undefined,
              ...(rampInfo
                ? {
                    "Ramp Start": (
                      <span>
                        <span tw="font-semibold">
                          {parseInt(
                            rampInfo.initialA.toString(),
                          ).toLocaleString()}
                          x
                        </span>
                        <span tw="ml-2 text-gray-300">
                          (
                          {rampInfo.start.toLocaleString(undefined, {
                            timeZoneName: "short",
                          })}
                          )
                        </span>
                      </span>
                    ),
                    "Ramp Stop": (
                      <span>
                        <span tw="font-semibold">
                          {parseInt(
                            rampInfo.targetA.toString(),
                          ).toLocaleString()}
                          x
                        </span>
                        <span tw="ml-2 text-gray-300">
                          (
                          {rampInfo.stop.toLocaleString(undefined, {
                            timeZoneName: "short",
                          })}
                          )
                        </span>
                      </span>
                    ),
                  }
                : {}),
            }}
          />
        </InnerSection>
        <InnerSection>
          <AttributeList
            loading={!swap}
            attributes={{
              "Trade Fee": swap?.state.fees.trade,
              "Withdraw Fee": swap?.state.fees.withdraw,
            }}
          />
          {/*
        TODO(igm): readd when we know what the APY is
         <PoolInfoField name="Current APY">
          {exchangeInfo?.ampFactor?.toString()}
        </PoolInfoField> */}
        </InnerSection>
      </SubLayout>
      {sourceA && <SourceInfoCard tw="mt-6" source={sourceA} />}
      {sourceB && <SourceInfoCard tw="mt-6" source={sourceB} />}
      <SubLayout
        title="Account Info"
        noPad
        css={css`
          margin-top: 48px;
        `}
      >
        <InnerSection>
          {symbolA === symbolB ? (
            <AttributeList
              loading={!swap}
              attributes={{
                "Swap Account": swap?.config.swapAccount,
                "Pool Token Address": swap?.state.poolTokenMint,
                [`${exchange?.tokens[0].name ?? "unknown"} Address`]:
                  swap?.state.tokenA.mint,
                [`${symbolB} Address`]: swap?.state.tokenB.mint,
                [`${exchange?.tokens[0].name ?? "unknown"} Reserves`]:
                  swap?.state.tokenA.reserve,
                [`${symbolB} Reserves`]: swap?.state.tokenB.reserve,
              }}
            />
          ) : (
            <AttributeList
              loading={!swap}
              attributes={{
                "Swap Account": swap?.config.swapAccount,
                "Pool Token Address": swap?.state.poolTokenMint,
                [`${symbolA} Address`]: swap?.state.tokenA.mint,
                [`${symbolB} Address`]: swap?.state.tokenB.mint,
                [`${symbolA} Reserves`]: swap?.state.tokenA.reserve,
                [`${symbolB} Reserves`]: swap?.state.tokenB.reserve,
              }}
            />
          )}
        </InnerSection>
      </SubLayout>
    </>
  );
};

const InnerSection = styled.div`
  padding: 24px;
  display: grid;
  grid-row-gap: 16px;
  grid-auto-flow: row;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
`;

const StarPower = styled.span`
  ${tw`text-white font-semibold`}
  @keyframes glow {
    from {
      text-shadow:
        0 0 10px #fff,
        0 0 15px #00ffff;
    }
    50% {
      text-shadow:
        0 0 10px #fff,
        0 0 15px #ff00ff;
    }
    to {
      text-shadow:
        0 0 10px #fff,
        0 0 15px #ffff00;
    }
  }
  animation: glow 3s ease-in-out infinite alternate;
`;
