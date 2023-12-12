import type { Trade } from "@saberhq/saber-periphery";
import { useSail, useTXHandlers, useUserATAs } from "@saberhq/sail";
import { exists, mapSome, PACKET_DATA_SIZE } from "@saberhq/solana-contrib";
import type { Token, TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import { startTransition, useCallback, useEffect, useState } from "react";
import invariant from "tiny-invariant";

import { useRouter } from "../../contexts/router";
import { useSDK } from "../../contexts/sdk";
import { useSettings } from "../../contexts/settings";
import { rawSOLOverride } from "../rawSOL";

export interface ITrade {
  fromAmount: TokenAmount;
  toToken: Token;
}

type ISwapCallback = () => Promise<void>;

/**
 * Allows performing a trade
 */
export const useTrade = ({
  fromAmount,
  toToken,
}: Partial<ITrade>): {
  swapDisabledReason?: string;
  handleSwap: ISwapCallback;
  trade?: Trade;
} => {
  const wallet = useConnectedWallet();
  const { saber } = useSDK();
  const { refetchMany } = useSail();
  const { getTrades, loading: routerLoading, executeTrade } = useRouter();

  const [userFromAccount] = useUserATAs(
    mapSome(fromAmount, (f) => rawSOLOverride(f.token)),
  );

  const [trades, setTrades] = useState<Trade[] | undefined>(undefined);
  useEffect(() => {
    startTransition(() => {
      if (!fromAmount || !toToken || fromAmount.isZero() || routerLoading) {
        setTrades(undefined);
      } else {
        setTrades(getTrades(fromAmount, toToken));
      }
    });
  }, [fromAmount, getTrades, routerLoading, toToken]);

  const { signAndConfirmTX } = useTXHandlers();

  const bestTrade = trades?.[0];

  const [executableTrade, setExecutableTrade] = useState<
    Trade | null | undefined
  >(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      setExecutableTrade(undefined);

      if (!trades || !saber) {
        return;
      }

      try {
        const possibleTrades = (
          await Promise.all(
            trades.slice(0, Math.min(trades.length, 5)).map(async (t) => {
              const possibleTx = await executeTrade({ saber, trade: t });
              if ("size" in possibleTx.tradeTX.estimateSize()) {
                return t;
              }
            }),
          )
        ).filter(exists);
        if (cancel) {
          return;
        }

        if (!possibleTrades[0]) {
          console.log("nope2");
        }
        setExecutableTrade(possibleTrades[0] ?? null);
      } catch (e) {
        setExecutableTrade(undefined);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [executeTrade, saber, trades]);

  const trade = executableTrade ?? bestTrade ?? undefined;

  const handleSwap = useCallback(async () => {
    invariant(saber, "saber not connected");
    invariant(trade, "trade must exist");

    const { initTX, tradeTX, exchanges } = await executeTrade({
      saber,
      trade,
    });

    const actionDesc = `Swap ${trade.inputAmount.toSignificant(4)} ${
      trade.inputAmount.token.symbol
    } for ${trade.outputAmount.token.symbol}`;

    const mergedTX = initTX.combine(tradeTX);
    if (mergedTX.estimateSizeUnsafe() < PACKET_DATA_SIZE) {
      await signAndConfirmTX(mergedTX, actionDesc);
    } else {
      if (initTX.instructions.length > 0) {
        await signAndConfirmTX(initTX, "Set up token accounts");
      }
      await signAndConfirmTX(tradeTX, actionDesc);
    }

    void refetchMany(exchanges.map((x) => x.swapAccount));
  }, [executeTrade, refetchMany, saber, signAndConfirmTX, trade]);

  const { maxSlippagePercent } = useSettings();

  const swapDisabledReason =
    !wallet || !saber
      ? "Connect Wallet"
      : !fromAmount || fromAmount.isZero()
        ? "Enter an amount"
        : routerLoading || !toToken || trades === undefined
          ? "Loading..."
          : !userFromAccount || userFromAccount.balance.lessThan(fromAmount)
            ? `Insufficient ${fromAmount.token.symbol} balance`
            : executableTrade?.priceImpact.greaterThan(maxSlippagePercent)
              ? "Price impact too high"
              : executableTrade === null
                ? "No route found"
                : undefined;

  return {
    handleSwap,
    swapDisabledReason,
    trade,
  };
};
