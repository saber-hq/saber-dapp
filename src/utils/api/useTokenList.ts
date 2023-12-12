import { fetchNullableWithSessionCache } from "@saberhq/sail";
import { formatNetwork } from "@saberhq/solana-contrib";
import type { TokenList } from "@saberhq/token-utils";
import { useConnectionContext } from "@saberhq/use-solana";
import { useQuery } from "react-query";

export const useTokenList = () => {
  const { network } = useConnectionContext();
  return useQuery(["saberTokenList", network], async () => {
    return await fetchNullableWithSessionCache<TokenList>(
      `https://raw.githubusercontent.com/saber-hq/saber-registry-dist/master/data/token-list.${formatNetwork(
        network,
      )}.json`,
    );
  });
};
