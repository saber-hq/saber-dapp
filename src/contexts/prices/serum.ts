import { decodeEventQueue, Market } from "@project-serum/serum";
import { useAccountData } from "@saberhq/sail";
import { Fraction } from "@saberhq/token-utils";
import type { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";

import { SBR_INFO } from "../../utils/builtinTokens";
import { SERUM_DEX_PROGRAM_ID } from "../../utils/constants";

export const useSerumPrice = (
  market: PublicKey,
): {
  loading: boolean;
  price: Fraction | null;
} => {
  const { data: sbrPriceData, loading: sbrMarketLoading } =
    useAccountData(market);
  const { sbrUSDCSerumMarket, eventQueueKey } = useMemo(() => {
    if (!sbrPriceData?.accountInfo.data) {
      return { eventQueueKey: null, sbrUSDCSerumMarket: null };
    }
    const decoded: unknown = (
      Market.getLayout(SERUM_DEX_PROGRAM_ID) as {
        decode: (data: Buffer) => unknown;
      }
    ).decode(sbrPriceData.accountInfo.data);
    const eventQueueKey = (decoded as { eventQueue: PublicKey }).eventQueue;
    const market = new Market(
      decoded,
      SBR_INFO.decimals,
      // USDC decimals
      6,
      {},
      SERUM_DEX_PROGRAM_ID,
    );
    return { eventQueueKey, sbrUSDCSerumMarket: market };
  }, [sbrPriceData]);

  const { data: sbrEventQueueData, loading: eventQueueLoading } =
    useAccountData(eventQueueKey);

  const sbrPriceUSD = useMemo(() => {
    if (!sbrEventQueueData || !sbrUSDCSerumMarket) {
      return null;
    }
    const events = decodeEventQueue(sbrEventQueueData.accountInfo.data, 100);
    const allEvents = events
      .filter(
        (event) => event.eventFlags.fill && event.nativeQuantityPaid.gtn(0),
      )
      .map(sbrUSDCSerumMarket.parseFillEvent.bind(sbrUSDCSerumMarket));
    const lastPrice = (allEvents[0] as { price: number } | undefined)?.price;
    if (typeof lastPrice !== "number") {
      return null;
    }
    return new Fraction(Math.floor(lastPrice * 10_000_000), 10_000_000);
  }, [sbrUSDCSerumMarket, sbrEventQueueData]);

  return { loading: sbrMarketLoading || eventQueueLoading, price: sbrPriceUSD };
};
