import { useUserATAs } from "@saberhq/sail";
import { TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import React, { useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";

import { useSwappableTokens } from "../../../../contexts/swappableTokens";
import { useConnectWallet } from "../../../../contexts/wallet";
import { Tags } from "../../../../utils/builtinTokens";
import { useDeposit } from "../../../../utils/exchange/useDeposit";
import { rawSOLOverride } from "../../../../utils/rawSOL";
import { useEnvironment } from "../../../../utils/useEnvironment";
import { useStableSwap } from "../../../../utils/useStableSwap";
import { Button } from "../../../common/Button";
import { TokenAmountSelector } from "../../../common/TokenAmountSelector";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";
import { DepositConfirmModal } from "./DepositConfirmModal";

interface IProps {
  disabled?: boolean;
}

export const Deposit: React.FC<IProps> = ({ disabled }: IProps) => {
  const wallet = useConnectedWallet();
  const connect = useConnectWallet();
  const { exchange } = useStableSwap();
  const { tokens: allTokens } = useEnvironment();

  // tokens are normalized
  const tokens = exchange?.tokens?.map((tok) => {
    if (tok.info.tags?.includes(Tags.DecimalWrapped)) {
      const realTok = allTokens.find(
        (t) => t.address === tok.info.extensions?.assetContract,
      );
      invariant(realTok, "dual token not found");
      return realTok;
    }
    return tok;
  });

  const [tokenAccountA, tokenAccountB] = useUserATAs(
    ...(tokens?.map(rawSOLOverride) ?? []),
  );
  const [uiAmounts, setUIAmounts] = useState<readonly [string, string]>([
    "",
    "",
  ]);

  const tokenAmounts = useMemo(
    () =>
      tokens?.map((token, i) => {
        try {
          return TokenAmount.parse(token, uiAmounts[i] ?? "0");
        } catch (e) {
          return new TokenAmount(token, 0);
        }
      }) ?? [],
    [tokens, uiAmounts],
  );

  const deposit = useDeposit({
    tokenAmounts,
  });
  const { depositDisabledReason, estimatedDepositSlippage } = deposit;

  const [isDepositModalOpen, setDepositModalOpen] = useState<boolean>(false);

  const tokenAccounts = [tokenAccountA, tokenAccountB] as const;

  const { swappableTokens } = useSwappableTokens();

  return (
    <>
      <DepositConfirmModal
        deposit={deposit}
        tokenAmounts={tokenAmounts}
        isOpen={isDepositModalOpen}
        onDismiss={() => setDepositModalOpen(false)}
        onSuccess={() => {
          setUIAmounts(["", ""]);
        }}
      />
      <InnerContainer noPad>
        <Currencies>
          {tokens?.map((token, i) => (
            <CurrencyWrapper key={token.address}>
              <TokenAmountSelector
                tokens={swappableTokens}
                selectedValue={token}
                inputValue={uiAmounts[i] ?? ""}
                inputOnChange={(val) => {
                  const nextAmts = uiAmounts.slice();
                  nextAmts[i] = val.toString();
                  setUIAmounts(
                    nextAmts as unknown as readonly [string, string],
                  );
                }}
                currentAmount={{
                  amount: tokenAccounts[i]?.balance,
                  allowSelect: true,
                }}
                slippage={estimatedDepositSlippage ?? undefined}
              />
            </CurrencyWrapper>
          ))}
        </Currencies>
        <DepositButton>
          {!wallet ? (
            <Button size="large" variant="secondary" onClick={connect}>
              Connect Wallet
            </Button>
          ) : (
            <Button
              size="large"
              disabled={depositDisabledReason !== undefined || disabled}
              variant={
                depositDisabledReason?.includes("impact") ? "danger" : "primary"
              }
              onClick={() => {
                setDepositModalOpen(true);
              }}
            >
              {disabled ? "Disabled" : depositDisabledReason ?? "Deposit"}
            </Button>
          )}
        </DepositButton>
      </InnerContainer>
    </>
  );
};

const CurrencyWrapper = styled.div`
  padding: 24px;
`;

const Currencies = styled.div`
  ${CurrencyWrapper}:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
`;

const DepositButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
