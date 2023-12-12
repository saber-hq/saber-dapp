import { makeProgramParserHooks } from "@saberhq/sail";
import { mapSome } from "@saberhq/solana-contrib";
import {
  decodeSwap,
  getSwapAuthorityKey,
  SWAP_PROGRAM_ID,
} from "@saberhq/stableswap-sdk";
import type { PublicKey } from "@solana/web3.js";

export const {
  StableSwap: {
    useSingleData: useStableSwapData,
    useData: useStableSwapDatas,
    useBatchedData: useStableSwapsData,
  },
} = makeProgramParserHooks({
  address: SWAP_PROGRAM_ID,
  accountParsers: {
    StableSwap: decodeSwap,
  },
});

export const useSwapAuthorityKey = (swap: PublicKey | null | undefined) => {
  return mapSome(swap, (s) => getSwapAuthorityKey(s));
};
