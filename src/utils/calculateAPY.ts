import type { Fraction, TokenAmount } from "@saberhq/token-utils";
import { Percent } from "@saberhq/token-utils";

export const calculateAPY = ({
  sbrPrice,
  dailyRewardsRate,
  tvlUSD,
}: {
  sbrPrice: Fraction;
  dailyRewardsRate: TokenAmount;
  tvlUSD: Fraction;
}): { apy: Percent | null } => {
  const dpyUSD = dailyRewardsRate.multiply(sbrPrice).divide(tvlUSD);

  const num = parseFloat(dpyUSD.add(1).asFraction.toFixed(6)) ** 365 - 1;
  const numerator = Math.floor(num * 10_000_000_000);
  if (Number.isFinite(numerator)) {
    return { apy: new Percent(numerator, 10_000_000_000) };
  }
  return { apy: null };
};

export const calculateAPYFromDPR = (dpr: number) => (dpr + 1) ** 365 - 1;
