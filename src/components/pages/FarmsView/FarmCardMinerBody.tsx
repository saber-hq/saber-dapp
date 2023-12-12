import type { ProgramAccount } from "@project-serum/anchor";
import type { MinerData } from "@quarryprotocol/quarry-sdk";
import { useMiner, useQuarry, useRewarder } from "@quarryprotocol/react-quarry";
import { TokenAmount } from "@saberhq/token-utils";
import React, { useMemo } from "react";
import { css, styled } from "twin.macro";

import { CurrencyMarket } from "../../../utils/currencies";
import type { PlotInfo } from "../../../utils/farming/useAllPlots";
import { useUserPlotShare } from "../../../utils/farming/useUserPlotShare";
import { formatCurrencySmart } from "../../../utils/format";
import { useStableSwap } from "../../../utils/useStableSwap";
import { TokenAmountDisplay } from "../../common/TokenAmountDisplay";
import { LineItem } from "./LineItem";

interface Props {
  info: PlotInfo;
  miner: ProgramAccount<MinerData>;
}

export const FarmCardMinerBody: React.FC<Props> = ({ info, miner }: Props) => {
  const { currency } = useStableSwap();
  const stakedAmount = useMemo(() => {
    return new TokenAmount(info.pool.lpToken, miner.account.balance);
  }, [info.pool.lpToken, miner.account.balance]);
  const { stakeValue, stakeValueUSD } = useUserPlotShare({ stakedAmount });

  const { rewardToken, quarries } = useRewarder();
  const { quarry } = useQuarry();
  const { rewards } = useMiner();
  const index = quarries?.findIndex((q) => q.key.equals(quarry.key)) ?? -1;
  const rewardsPerDay = useMemo(() => {
    if (!rewardToken) {
      return null;
    }
    const ratePerSecond = rewards.rates?.pools[index];
    if (typeof ratePerSecond !== "number") {
      return null;
    }
    return TokenAmount.parse(rewardToken, (ratePerSecond * 86_400).toString());
  }, [index, rewardToken, rewards.rates?.pools]);

  return (
    <>
      <Separator>
        <SeparatorInner />
      </Separator>
      <LineItem label="Your Stake">
        {stakeValue && (
          <>
            {formatCurrencySmart(stakeValue, currency)}
            {stakeValueUSD &&
              currency !== CurrencyMarket.USD &&
              ` (${formatCurrencySmart(stakeValueUSD, CurrencyMarket.USD)})`}
          </>
        )}
      </LineItem>
      <LineItem label="Your Reward Rate">
        {rewardsPerDay && (
          <div
            css={css`
              display: flex;
              align-items: center;
              gap: 4px;
            `}
          >
            <TokenAmountDisplay amount={rewardsPerDay} showIcon />
            <span>/ day</span>
          </div>
        )}
      </LineItem>
    </>
  );
};

const Separator = styled.div`
  height: 20px;
`;

const SeparatorInner = styled.hr`
  border-color: ${({ theme }) => theme.colors.text.default};
`;
