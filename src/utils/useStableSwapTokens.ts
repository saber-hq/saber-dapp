import type { AssociatedTokenAccount } from "@saberhq/sail";
import { useUserATAs } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import * as Sentry from "@sentry/react";
import { useMemo } from "react";

import { WrappedToken } from "../components/pages/PoolView/Withdraw/wrappedToken";
import { Tags } from "./builtinTokens";
import { rawSOLOverride } from "./rawSOL";
import { useEnvironment } from "./useEnvironment";
import { useStableSwap } from "./useStableSwap";

interface ExchangeTokens {
  tokens?: readonly [Token, Token];
  underlyingTokens?: Token[];
  wrappedTokens: WrappedToken[];
  poolTokenAccount?: AssociatedTokenAccount | null;
  tokenAccounts: readonly (AssociatedTokenAccount | null | undefined)[];
  underlyingTokenAccounts: readonly (
    | AssociatedTokenAccount
    | null
    | undefined
  )[];
}

export const useStableSwapTokens = (): ExchangeTokens => {
  const { tokens: allTokens } = useEnvironment();
  const { exchange } = useStableSwap();

  // tokensRaw may still be in wrapped form
  const tokens = exchange?.tokens;

  // tokens are normalized
  const { underlyingTokens, newUnderlyingTokens, wrappedTokens } =
    useMemo(() => {
      const underlyingTokens = tokens?.map((tok) => {
        if (tok.info.tags?.includes(Tags.DecimalWrapped)) {
          const realTok = allTokens.find(
            (t) => t.address === tok.info.extensions?.assetContract,
          );
          if (!realTok) {
            const err = new Error(
              `Missing decimal wrapper underlying in token list.`,
            );
            Sentry.captureException(err, {
              extra: {
                tokenInfo: JSON.stringify(tok.info, null, 2),
                underlying: tok.info.extensions?.assetContract,
                tokenList: JSON.stringify(
                  allTokens.map((t) => t.address),
                  null,
                  2,
                ),
              },
            });
            throw err;
          }
          return realTok;
        }
        return tok;
      });
      const newUnderlyingTokens = underlyingTokens?.filter(
        (tok) => !tokens?.find((t) => t.address === tok?.address),
      );
      const wrappedTokens =
        tokens?.map((tok, i) => {
          return new WrappedToken(tok, underlyingTokens?.[i]);
        }) ?? [];

      return { underlyingTokens, newUnderlyingTokens, wrappedTokens };
    }, [allTokens, tokens]);

  const [poolTokenAccount, ...tokenAccounts] = useUserATAs(
    ...[
      exchange?.lpToken,
      ...(tokens ?? []),
      ...(newUnderlyingTokens ?? []),
    ].map(rawSOLOverride),
  );
  const underlyingTokenAccounts = useUserATAs(
    ...(underlyingTokens?.map(rawSOLOverride) ?? []),
  );

  return {
    tokens,
    underlyingTokens,
    wrappedTokens,
    poolTokenAccount,
    tokenAccounts,
    underlyingTokenAccounts,
  };
};
