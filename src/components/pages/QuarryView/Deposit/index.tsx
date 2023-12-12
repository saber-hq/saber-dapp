import { useQuarry, useQuarryStake } from "@quarryprotocol/react-quarry";
import { TokenAmount } from "@saberhq/token-utils";
import React, { useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";

import { useCurrentPlotInfo } from "../../../../contexts/plotInfo";
import { getMarket } from "../../../../utils/currencies";
import { AsyncButton } from "../../../common/AsyncButton";
import { TokenAmountSelector } from "../../../common/TokenAmountSelector";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";

export const Deposit: React.FC = () => {
  const {
    pool: {
      tokens: [tokenA],
    },
  } = useCurrentPlotInfo();
  const { stakedToken, userStakedTokenBalance } = useQuarry();
  const [depositAmountStr, setDepositAmountStr] = useState<string>("");

  const stake = useQuarryStake();

  const depositAmount = useMemo(() => {
    if (!stakedToken) {
      return null;
    }
    try {
      return TokenAmount.parse(stakedToken, depositAmountStr);
    } catch (e) {
      // ignore
    }
  }, [depositAmountStr, stakedToken]);

  const stakeDisabledReason =
    !depositAmount || depositAmount.isZero() ? "Enter an amount" : null;

  return (
    <InnerContainer noPad>
      <InnerSection>
        <TokenAmountSelector
          tokens={[]}
          selectedValue={stakedToken ?? null}
          inputValue={depositAmountStr}
          inputOnChange={setDepositAmountStr}
          currentAmount={{
            amount: userStakedTokenBalance?.balance,
            allowSelect: true,
          }}
          currency={getMarket(tokenA)}
        />
      </InnerSection>
      <DepositButton>
        <AsyncButton
          size="large"
          disabled={!!stakeDisabledReason}
          onClick={async () => {
            invariant(depositAmount, "no deposit amount");
            await stake(depositAmount);
            setDepositAmountStr("");
          }}
        >
          {stakeDisabledReason ?? "Deposit"}
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
