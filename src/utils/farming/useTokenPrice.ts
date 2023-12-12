import { mapN } from "@saberhq/solana-contrib";

import { usePrices } from "../../contexts/prices";

export const useTokenPrice = (): {
  loading: boolean;
  price: number | null | undefined;
} => {
  const { data, isLoading } = usePrices();
  return { loading: isLoading, price: mapN((data) => data.saber, data) };
};
