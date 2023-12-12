import { useUserATAs } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import { TokenAmount, WRAPPED_SOL } from "@saberhq/token-utils";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import React, { useEffect, useMemo, useState } from "react";
import { css, styled } from "twin.macro";

import { useRouter } from "../../../contexts/router";
import { useSwappableTokens } from "../../../contexts/swappableTokens";
import { useConnectWallet } from "../../../contexts/wallet";
import { DUMMY_TOKEN } from "../../../utils/constants";
import { useTrade } from "../../../utils/exchange/useTrade";
import { rawSOLOverride } from "../../../utils/rawSOL";
import { Button } from "../../common/Button";
import { SeenIsCollapse } from "../../common/SeenIsCollapse";
import { TokenAmountSelector } from "../../common/TokenAmountSelector";
import { WrappedSOLAlert } from "../../common/WrappedSolAlert";
import { InnerContainer } from "../../layout/MainLayout/PageContainer";
import { ExchangeRate } from "./ExchangeRate";
import { MiddleArrow } from "./MiddleArrow";
import { SwapConfirmModal } from "./SwapConfirmModal";
import { useSwapState } from "./useSwapState";

export const ExchangeSwap: React.FC = () => {
  const wallet = useConnectedWallet();
  const connect = useConnectWallet();
  const { network } = useConnectionContext();

  const {
    selectedFrom,
    selectedTo,
    setSelectedFrom,
    setSelectedTo,

    uiFromAmount,
    setUIFromAmount,
    uiToAmount,
    setUIToAmount,

    invertSwap,
    fromAmount,
  } = useSwapState();

  const [userFromAccount, userToAccount, wrappedSolAccount] = useUserATAs(
    rawSOLOverride(selectedFrom),
    rawSOLOverride(selectedTo),
    WRAPPED_SOL[network],
  );

  const { swapDisabledReason, trade, handleSwap } = useTrade({
    fromAmount,
    toToken: selectedTo ?? undefined,
  });

  useEffect(() => {
    if (!trade) {
      setUIToAmount("");
      return;
    }
    const nextAmt = trade.outputAmount.toExact();
    if (nextAmt) {
      setUIToAmount(nextAmt);
    }
  }, [trade, setUIToAmount]);

  const [isSwapModalOpen, setSwapModalOpen] = useState<boolean>(false);

  const { getTrades, loading: routerLoading } = useRouter();
  const unitPrice = useMemo(() => {
    if (selectedFrom && selectedTo && !routerLoading) {
      return (
        getTrades(new TokenAmount(selectedFrom, 10_000), selectedTo, 3)[0]
          ?.route.midPrice ?? null
      );
    }
    return null;
  }, [selectedFrom, selectedTo, routerLoading, getTrades]);
  const price = trade?.executionPrice ?? unitPrice;

  const { swappableTokens } = useSwappableTokens();
  const swappableTokensForMarket = useMemo(() => {
    const filteredTokens = swappableTokens.filter(
      (t) =>
        t.info.extensions?.currency === selectedFrom?.info.extensions?.currency,
    );
    return [
      ...filteredTokens,
      ...Array<Token>(swappableTokens.length - filteredTokens.length).fill(
        DUMMY_TOKEN,
      ),
    ];
  }, [selectedFrom?.info.extensions?.currency, swappableTokens]);

  return (
    <>
      <SwapConfirmModal
        handleSwap={handleSwap}
        trade={trade}
        isOpen={isSwapModalOpen}
        onDismiss={() => setSwapModalOpen(false)}
        onSuccess={() => setUIFromAmount("")}
      />

      <SeenIsCollapse
        visible={
          wrappedSolAccount?.balance.greaterThan(
            new TokenAmount(WRAPPED_SOL[network], 0),
          ) ?? false
        }
      >
        <WrappedSOLAlert wSOLAmount={wrappedSolAccount?.balance} />
      </SeenIsCollapse>
      <SwapContainer>
        <InnerContainer
          css={css`
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
          `}
        >
          <SwapHalf>
            <TokenAmountSelector
              tokens={swappableTokens}
              onSelect={setSelectedFrom}
              selectedValue={selectedFrom}
              inputValue={uiFromAmount}
              inputOnChange={setUIFromAmount}
              currentAmount={{
                amount: userFromAccount?.balance,
                allowSelect: true,
              }}
            />
          </SwapHalf>
          <MiddleArrow onClick={invertSwap} />
          <SwapHalf>
            <TokenAmountSelector
              tokens={swappableTokensForMarket}
              onSelect={setSelectedTo}
              selectedValue={selectedTo}
              inputValue={uiToAmount}
              slippage={trade?.priceImpact}
              inputDisabled
              currentAmount={{ amount: userToAccount?.balance }}
            />
          </SwapHalf>
        </InnerContainer>
        <ExchangeRate loading={routerLoading} price={price} />
      </SwapContainer>
      {!wallet ? (
        <Button size="large" variant="secondary" onClick={() => connect()}>
          Connect Wallet
        </Button>
      ) : (
        <Button
          size="large"
          disabled={swapDisabledReason !== undefined}
          onClick={() => {
            setSwapModalOpen(true);
          }}
        >
          {swapDisabledReason ?? "Review"}
        </Button>
      )}
    </>
  );
};

const SwapContainer = styled.div`
  ${({ theme }) => theme["swap box shadow"]};
`;

const SwapHalf = styled.div``;
