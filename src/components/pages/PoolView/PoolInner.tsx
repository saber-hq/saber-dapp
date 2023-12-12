import { useUserATAs } from "@saberhq/sail";
import { exists, mapN } from "@saberhq/solana-contrib";
import { Fraction, TokenAmount, WRAPPED_SOL } from "@saberhq/token-utils";
import { useConnectionContext } from "@saberhq/use-solana";
import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { css, styled } from "twin.macro";

import { useCurrentPlotInfo } from "../../../contexts/plotInfo";
import { useStats } from "../../../contexts/stats";
import { calculateAPYFromDPR } from "../../../utils/calculateAPY";
import { FTT_MIGRATION_PAGE } from "../../../utils/constants";
import { CURRENCY_INFO, CurrencyMarket } from "../../../utils/currencies";
import {
  formatSharePercent,
  useUserPoolShare,
} from "../../../utils/exchange/useUserPoolShare";
import { useAllPlots } from "../../../utils/farming/useAllPlots";
import {
  DOLLAR_FORMATTER_WHOLE,
  formatCurrencySmart,
  PERCENT_FORMATTER,
} from "../../../utils/format";
import { useStableSwap } from "../../../utils/useStableSwap";
import { Alert } from "../../common/Alert";
import {
  ASOL_SWAP_LINK,
  LUNA_SWAP_LINK,
  SenchaInfoCard,
} from "../../common/cards/SenchaInfoCard";
import { SeenIsCollapse } from "../../common/SeenIsCollapse";
import { WrappedSOLAlert } from "../../common/WrappedSolAlert";
import { InnerContainerMenu } from "../../layout/MainLayout/InnerContainerMenu";
import { SubLayout } from "../../layout/SubLayout";
import { Deposit } from "./Deposit";
import { PoolInfo } from "./PoolInfo";
import { ShareMetric } from "./ShareMetric";
import { Withdraw } from "./Withdraw";

export const PoolInner: React.FC = () => {
  const { plots } = useAllPlots();
  const info = useCurrentPlotInfo();
  const { pool, poolID, quarry } = info;
  const { userSharePercent, shareValue, lpTokenBalance } = useUserPoolShare();
  const { network } = useConnectionContext();
  const [wrappedSolAccount] = useUserATAs(WRAPPED_SOL[network]);

  const { exchangeInfo, currency, currencyPriceUSD } = useStableSwap();
  const total = exchangeInfo?.reserves
    .map((r) => r.amount.asFraction)
    .reduce((acc, el) => acc.add(el));
  const totalUSD = mapN(
    (currencyPriceUSD, total) => currencyPriceUSD * total.asNumber,
    currencyPriceUSD,
    total,
  );

  const isCashPool = pool.name.includes("CASH");
  const newPool =
    pool.newPoolID && plots.find((p) => p.poolID === pool.newPoolID);

  const shareValueStr = formatCurrencySmart(
    shareValue ?? new Fraction(0),
    currency,
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
      minimumSignificantDigits: undefined,
      maximumSignificantDigits: undefined,
    },
  );

  const stats = useStats().data?.find(
    (poolStats) => poolStats.ammId === pool.swap.config.swapAccount.toString(),
  );

  const vol24HUSD =
    stats && exists(currencyPriceUSD) && stats.stats.vol24h
      ? stats.stats.vol24h * currencyPriceUSD
      : null;
  const fees24HUSD = vol24HUSD
    ? vol24HUSD * pool.swap.state.fees.trade.asFraction.asNumber
    : null;
  const feesAPY =
    fees24HUSD && totalUSD ? calculateAPYFromDPR(fees24HUSD / totalUSD) : null;

  return (
    <>
      <YourShares>
        {stats && (
          <>
            <ShareMetric
              title="Volume (24h)"
              value={
                <div tw="flex flex-col gap-1">
                  <div tw="flex items-center gap-2">
                    <span>
                      {vol24HUSD ? (
                        formatCurrencySmart(vol24HUSD, CurrencyMarket.USD)
                      ) : stats.stats.vol24h ? (
                        formatCurrencySmart(stats.stats.vol24h, currency)
                      ) : (
                        <span tw="text-gray-500">Unknown</span>
                      )}
                    </span>
                    <a
                      href={`https://saber.markets/#/pools/${pool.swapAccount.toString()}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      css={css`
                        line-height: 1;
                      `}
                    >
                      <FaExternalLinkAlt />
                    </a>
                  </div>
                  <div tw="text-xs text-gray-500">
                    Fees:{" "}
                    <span tw="text-gray-300">
                      {fees24HUSD
                        ? DOLLAR_FORMATTER_WHOLE.format(fees24HUSD)
                        : "$--"}
                    </span>
                  </div>
                </div>
              }
            />
            <ShareMetric
              title="Fees APY"
              value={feesAPY ? PERCENT_FORMATTER.format(feesAPY) : "--%"}
            />
          </>
        )}
        <ShareMetric
          title="Your Share"
          value={
            shareValueStr === undefined
              ? "Wallet not connected"
              : `${shareValueStr} (${formatSharePercent(userSharePercent)})`
          }
          faded={shareValue === undefined}
        />
      </YourShares>
      {CURRENCY_INFO[pool.currency].name === "Luna" && (
        <SenchaInfoCard tokenSymbol="wtLUNA" swapLink={LUNA_SWAP_LINK} />
      )}
      {pool?.id === "asol" && (
        <SenchaInfoCard tokenSymbol="aSOL" swapLink={ASOL_SWAP_LINK} />
      )}
      <SeenIsCollapse
        visible={
          wrappedSolAccount?.balance.greaterThan(
            new TokenAmount(WRAPPED_SOL[network], 0),
          ) ?? false
        }
      >
        <WrappedSOLAlert wSOLAmount={wrappedSolAccount?.balance} />
      </SeenIsCollapse>
      {isCashPool && (
        <Alert
          type="danger"
          css={css`
            margin-bottom: 24px;
          `}
        >
          <h2>CASH pools are disabled</h2>
          <p>
            The Cashio protocol suffered an exploit in 2022. Please withdraw
            your liquidity.
          </p>
        </Alert>
      )}
      {pool.deprecationInfo && (
        <Alert
          css={css`
            margin-bottom: 24px;
          `}
        >
          <h2>This pool is being deprecated</h2>
          {pool.deprecationInfo && <p>{pool.deprecationInfo.message}</p>}
          <a
            href={pool.deprecationInfo.link}
            target="_blank"
            css={css`
              display: inline-flex;
              align-items: center;
              svg {
                margin-left: 4px;
              }
            `}
            rel="noreferrer"
          >
            <span>Learn more</span>
            <FaExternalLinkAlt />
          </a>
        </Alert>
      )}
      {newPool && (
        <Alert
          css={css`
            margin-bottom: 24px;
          `}
        >
          <h2>There is a newer version of this pool</h2>
          <p>
            This pool is being migrated to the{" "}
            <Link to={`/pools/${newPool.poolID}/deposit`}>
              {newPool.pool.name}
            </Link>{" "}
            pool. It is recommended that you migrate your assets there.
          </p>
          {poolID === "ftt" && (
            <p>
              You can obtain Wormhole FTT from Sollet FTT by using{" "}
              <a href={FTT_MIGRATION_PAGE}>the Wormhole migration tool</a>.
            </p>
          )}
          <Link
            to={`/pools/${newPool.poolID}/deposit`}
            css={css`
              display: inline-flex;
              align-items: center;
              svg {
                margin-left: 4px;
              }
            `}
          >
            <span>Deposit into the {newPool.pool.name} pool</span>
            <FaExternalLinkAlt />
          </Link>
        </Alert>
      )}
      <SeenIsCollapse
        visible={
          !!(pool && lpTokenBalance && shareValue?.greaterThan(0) && quarry)
        }
      >
        <Alert
          css={css`
            margin-bottom: 24px;
          `}
        >
          <h2>You have {lpTokenBalance?.format()} unstaked LP tokens</h2>
          <p tw="mb-4">
            Stake into the {pool.name} farming pool to earn additional SBR
            rewards on your LP tokens.
          </p>
          {info.multiRewardsQuarryLink ? (
            <a
              href={info.multiRewardsQuarryLink}
              target="_blank"
              rel="noreferrer noopener"
              css={css`
                display: inline-flex;
                align-items: center;
                svg {
                  margin-left: 5px;
                }
              `}
            >
              <span>Farm SBR</span>
              <FaExternalLinkAlt />
            </a>
          ) : (
            <Link
              to={`/quarries/${poolID}/stake`}
              css={css`
                display: inline-flex;
                align-items: center;
                svg {
                  margin-left: 5px;
                }
              `}
            >
              <span>Farm SBR</span>
              <FaExternalLinkAlt />
            </Link>
          )}
        </Alert>
      </SeenIsCollapse>
      <SubLayout title="Position Management" noPad>
        <InnerContainerMenu
          items={[
            {
              title: "Deposit",
              content: <Deposit disabled={isCashPool} />,
              path: `deposit`,
            },
            {
              title: "Withdraw",
              content: <Withdraw />,
              path: `withdraw`,
            },
          ]}
        />
      </SubLayout>
      <PoolInfo />
    </>
  );
};

const YourShares = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 36px;
  margin-bottom: 36px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.primary};
`;
