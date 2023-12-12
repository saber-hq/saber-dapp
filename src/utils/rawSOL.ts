import { mapSome } from "@saberhq/solana-contrib";
import type { Token } from "@saberhq/token-utils";
import { NATIVE_MINT, RAW_SOL } from "@saberhq/token-utils";

export const rawSOLOverride = (token: Token | null | undefined) => {
  return mapSome(token, (t) =>
    t.mintAccount.equals(NATIVE_MINT) ? RAW_SOL[t.network] : t,
  );
};
