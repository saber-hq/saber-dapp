import { useUserATAs } from "@saberhq/sail";
import type { Fraction, Token } from "@saberhq/token-utils";
import { useMemo } from "react";

import { useRouter } from "../../../contexts/router";
import { CurrencyMarket } from "../../../utils/currencies";
import { formatCurrencySmart } from "../../../utils/format";
import { LineItem } from "./LineItem";

interface Props {
  lpToken: Token;
  tvl: Fraction | null;
  tvlUSD: Fraction | null;
  currency: CurrencyMarket;
}

export const PoolCardUserBody: React.FC<Props> = ({
  lpToken,
  tvl,
  tvlUSD,
  currency,
}: Props) => {
  const { exchangeMap } = useRouter();
  const poolInfo = exchangeMap[lpToken.address];
  const [userLP] = useUserATAs(lpToken);

  const { shareValue, shareValueUSD } = useMemo(() => {
    const shareValue =
      userLP && poolInfo && poolInfo.virtualPrice
        ? userLP.balance.multiply(poolInfo.virtualPrice)
        : undefined;

    const shareValueUSD =
      userLP && tvl && tvlUSD
        ? userLP.balance.multiply(tvlUSD).divide(tvl)
        : undefined;

    return { shareValue, shareValueUSD };
  }, [poolInfo, tvl, tvlUSD, userLP]);

  if (!shareValue || shareValue.isZero()) {
    return <></>;
  }

  // don't show dust
  // if (shareValueUSD && !shareValueUSD.greaterThan(new Fraction(10, 100))) {
  //   return <></>;
  // }

  return (
    <LineItem label="Your Deposits">
      {formatCurrencySmart(shareValue, currency)}
      {currency !== CurrencyMarket.USD &&
        shareValueUSD &&
        ` (${formatCurrencySmart(shareValueUSD, CurrencyMarket.USD)})`}
    </LineItem>
  );
};
