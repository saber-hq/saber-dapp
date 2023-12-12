import { useQuarry, useQuarryWithdraw } from "@quarryprotocol/react-quarry";
import { TokenAmount } from "@saberhq/token-utils";
import React, { useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";

import { useCurrentPlotInfo } from "../../../../contexts/plotInfo";
import { getMarket } from "../../../../utils/currencies";
import { AsyncButton } from "../../../common/AsyncButton";
import { TokenAmountSelector } from "../../../common/TokenAmountSelector";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";

export const Withdraw: React.FC = () => {
  const {
    pool: {
      tokens: [tokenA],
    },
    minerData: miner,
  } = useCurrentPlotInfo();
  const { stakedToken } = useQuarry();

  const stakedAmount = useMemo(() => {
    return stakedToken && miner
      ? new TokenAmount(stakedToken, miner.account.balance)
      : miner === undefined
        ? undefined
        : null;
  }, [miner, stakedToken]);

  const [withdrawAmountStr, setWithdrawAmountStr] = useState<string>("");
  const withdrawAmount = useMemo(() => {
    if (!stakedToken) {
      return null;
    }
    try {
      return TokenAmount.parse(stakedToken, withdrawAmountStr);
    } catch (e) {
      // ignore
    }
  }, [withdrawAmountStr, stakedToken]);

  const withdraw = useQuarryWithdraw();

  const withdrawDisabledReason =
    !withdrawAmount || withdrawAmount.isZero() ? "Enter an amount" : null;

  return (
    <InnerContainer noPad>
      <InnerSection>
        <TokenAmountSelector
          tokens={[]}
          selectedValue={stakedToken ?? null}
          inputValue={withdrawAmountStr}
          inputOnChange={setWithdrawAmountStr}
          currentAmount={{
            amount: stakedAmount ?? undefined,
            allowSelect: true,
          }}
          currency={getMarket(tokenA)}
        />
      </InnerSection>
      <DepositButton>
        <AsyncButton
          size="large"
          disabled={!!withdrawDisabledReason}
          onClick={async () => {
            invariant(withdrawAmount, "no withdraw amount");
            await withdraw(withdrawAmount);
            setWithdrawAmountStr("");
          }}
        >
          {withdrawDisabledReason ?? "Withdraw"}
        </AsyncButton>
      </DepositButton>
    </InnerContainer>
  );
};

const DepositButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const InnerSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
`;
