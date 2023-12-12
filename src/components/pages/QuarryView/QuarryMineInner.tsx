import type { Theme } from "@emotion/react";
import {
  useClaimableAmounts,
  useMiner,
  useQuarry,
  useRewarder,
} from "@quarryprotocol/react-quarry";
import { TokenAmount } from "@saberhq/token-utils";
import React, { useMemo } from "react";
import { css, styled } from "twin.macro";

import { useCurrentPlotInfo } from "../../../contexts/plotInfo";
import { AsyncLink } from "../../common/AsyncLink";
import { QuarryInfoCard } from "../../common/cards/QuarryInfoCard";
import {
  ASOL_SWAP_LINK,
  LUNA_SWAP_LINK,
  SenchaInfoCard,
} from "../../common/cards/SenchaInfoCard";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { SeenIsCollapse } from "../../common/SeenIsCollapse";
import { TokenAmountDisplay } from "../../common/TokenAmountDisplay";
import { InnerContainerMenu } from "../../layout/MainLayout/InnerContainerMenu";
import { SubLayout } from "../../layout/SubLayout";
import { ShareMetric } from "../PoolView/ShareMetric";
import { AboutLPTokens } from "./AboutLPTokens";
import { Deposit } from "./Deposit";
import { NumberCard } from "./NumberCard";
import { useQuarryClaimAndRedeem } from "./useQuarryClaimAndRedeem";
import { Withdraw } from "./Withdraw";

const formatAmt = (n: number): string => {
  if (n > 100_000) {
    return n.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }
  if (n < 10) {
    return n.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  }
  if (n < 1_000) {
    return n.toLocaleString(undefined, {
      maximumFractionDigits: 5,
    });
  }
  return n.toLocaleString();
};

export const QuarryMineInner: React.FC = () => {
  const { poolID, minerData: miner } = useCurrentPlotInfo();
  const { rewardToken, quarries } = useRewarder();
  const { rewards } = useMiner();

  const {
    stakedToken,
    userStakedTokenBalance,

    quarry,
    totalDeposits,
    totalRewardsPerDay,
  } = useQuarry();

  const index = useMemo(
    () => quarries?.findIndex((q) => q.key.equals(quarry.key)) ?? -1,
    [quarries, quarry.key],
  );
  const stakedAmount = useMemo(() => {
    return stakedToken && miner
      ? new TokenAmount(stakedToken, miner.account.balance)
      : miner === undefined
        ? undefined
        : null;
  }, [miner, stakedToken]);

  const amounts = useClaimableAmounts(rewards.amounts);

  const { claimableTokens, dailyTokens } = useMemo(() => {
    return {
      claimableTokens: amounts ? amounts?.pools[index] : undefined,
      dailyTokens: rewards.rates
        ? (rewards.rates.pools[index] ?? 0) * 86_400
        : undefined,
    };
  }, [amounts, index, rewards.rates]);

  const claim = useQuarryClaimAndRedeem();

  const loading = !!(
    quarry.quarry === undefined || userStakedTokenBalance === undefined
  );
  const quarryInfo = quarries?.[index];

  return (
    <>
      <YourShares>
        <ShareMetric
          title="Total staked"
          value={
            totalDeposits ? (
              <TokenAmountDisplay amount={totalDeposits} />
            ) : loading ? (
              <LoadingSpinner />
            ) : (
              "--"
            )
          }
        />
        <ShareMetric
          title="Pool Rate"
          value={
            <div
              css={css`
                display: inline-flex;
                align-items: center;
              `}
            >
              {totalRewardsPerDay ? (
                <TokenAmountDisplay
                  amount={totalRewardsPerDay}
                  numberFormatOptions={{ maximumFractionDigits: 0 }}
                />
              ) : loading ? (
                <LoadingSpinner />
              ) : (
                <span>0</span>
              )}
              <span
                css={css`
                  margin-left: 4px;
                `}
              >
                / day
              </span>
            </div>
          }
        />
      </YourShares>
      {(poolID === "wluna" || poolID === "luna") && (
        <SenchaInfoCard tokenSymbol="wtLUNA" swapLink={LUNA_SWAP_LINK} />
      )}
      {poolID === "asol" && (
        <SenchaInfoCard tokenSymbol="aSOL" swapLink={ASOL_SWAP_LINK} />
      )}
      {(quarryInfo?.quarryMeta?.replicaQuarries.length ?? 0) > 0 &&
      quarryInfo?.quarryAppDepositLink &&
      poolID !== "port_2pool" ? ( // XXX(michael): Port won't replenish their redeemer ...
        <QuarryInfoCard
          title="Earn more rewards on Quarry"
          ctaText={`Stake ${stakedToken?.name ?? "Saber LP"} on Quarry`}
          link={quarryInfo.quarryAppDepositLink}
        />
      ) : null}
      <SeenIsCollapse
        visible={
          !!(
            !loading &&
            (!stakedAmount || stakedAmount.isZero()) &&
            userStakedTokenBalance?.balance.isZero()
          )
        }
      >
        <AboutLPTokens />
      </SeenIsCollapse>
      <DepositInfo>
        <NumberCard
          css={(theme: Theme) => css`
            position: absolute;
            width: 100%;
            z-index: 1;
            box-shadow: ${theme.modalshadow};
          `}
          title="Your liquidity staked"
          amount={
            stakedAmount ? (
              <TokenAmountDisplay showSymbol={false} amount={stakedAmount} />
            ) : loading ? (
              <LoadingSpinner />
            ) : (
              "0"
            )
          }
          descriptor={stakedToken?.name ?? "--"}
        />
        <NumberCard
          css={(theme: Theme) => css`
            position: absolute;
            width: 100%;
            padding-top: calc(105px + 16px);
            height: calc(105px * 2);

            background: ${theme.colors.base.secondary};
          `}
          title="Your unclaimed tokens"
          amount={
            typeof claimableTokens === "number" ? (
              formatAmt(claimableTokens)
            ) : loading ? (
              <LoadingSpinner />
            ) : (
              "0"
            )
          }
          descriptor={
            dailyTokens ? (
              <span
                css={(theme: Theme) => css`
                  display: inline-flex;
                  color: ${dailyTokens === 0
                    ? theme.colors.text.default
                    : theme.colors.text.bold};
                `}
              >
                {dailyTokens !== 0 && (
                  <span
                    css={css`
                      margin-right: 4px;
                    `}
                  >
                    🔥
                  </span>
                )}
                {rewardToken ? (
                  <TokenAmountDisplay
                    amount={TokenAmount.parse(
                      rewardToken,
                      dailyTokens.toString() ?? "0",
                    )}
                  />
                ) : (
                  "--"
                )}
                <span
                  css={css`
                    margin-left: 4px;
                  `}
                >
                  / day
                </span>
              </span>
            ) : loading ? (
              <>
                <LoadingSpinner /> / day
              </>
            ) : (
              <span
                css={(theme: Theme) => css`
                  color: ${theme.colors.text.default};
                `}
              >
                0 / day
              </span>
            )
          }
          action={
            claimableTokens ? (
              <AsyncLink
                onClick={async () => {
                  await claim();
                }}
              >
                Claim
              </AsyncLink>
            ) : undefined
          }
        />
      </DepositInfo>
      <SubLayout title="Liquidity Mining" noPad>
        <InnerContainerMenu
          items={[
            {
              title: "Stake",
              content: <Deposit />,
              path: `stake`,
            },
            {
              title: "Unstake",
              content: <Withdraw />,
              path: `unstake`,
            },
          ]}
        />
      </SubLayout>
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

const DepositInfo = styled.div`
  position: relative;
  height: calc(105px * 2);
  margin-bottom: 24px;
`;
