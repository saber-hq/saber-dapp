import type { AssociatedTokenAccount } from "@saberhq/sail";
import { useSOLBalance, useUserATAs } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import { RAW_SOL } from "@saberhq/token-utils";
import { useConnectedWallet, useConnectionContext } from "@saberhq/use-solana";
import React, { useState } from "react";
import { css } from "twin.macro";

import { Tags } from "../../../utils/builtinTokens";
import { useEnvironment } from "../../../utils/useEnvironment";
import { InnerContainer } from "../../layout/MainLayout/PageContainer";
import { AirdropToken } from "./AirdropToken";
import { TwitterModal } from "./TwitterModal";
import { useHandleSolAirdrop } from "./useHandleSOLAirdrop";

export interface IRequestedToken {
  token: Token;
  account?: AssociatedTokenAccount;
}

export const Airdrop: React.FC = () => {
  const { network } = useConnectionContext();
  const wallet = useConnectedWallet();
  const { tokens } = useEnvironment();
  const nativeBalance = useSOLBalance(wallet?.publicKey);
  const tokensToAirdrop = tokens?.filter(
    (tok) =>
      !tok.info.tags?.includes(Tags.DecimalWrapped) &&
      (tok.symbol === "USDC" ||
        tok.symbol === "USDT" ||
        tok.name.includes("Test")),
  );
  const userTokenAccounts = useUserATAs(...(tokensToAirdrop ?? []));

  const [requestedToken, setRequestedToken] = useState<Token | undefined>(
    undefined,
  );

  const handleSolAirdrop = useHandleSolAirdrop();

  if (network === "mainnet-beta") {
    return <p>There is no airdrop available on mainnet.</p>;
  }

  return (
    <>
      <p
        css={css`
          margin-top: 12px;
          margin-bottom: 48px;
          font-weight: 500;
          font-size: 16px;
          line-height: 19px;
        `}
      >
        Claim devnet tokens to test Saber.
      </p>
      <TwitterModal
        token={requestedToken}
        isOpen={requestedToken !== undefined}
        onDismiss={() => setRequestedToken(undefined)}
      />
      <InnerContainer noPad>
        <AirdropToken
          token={RAW_SOL[network]}
          tokenBalance={nativeBalance}
          onClaim={handleSolAirdrop}
        />
        {tokensToAirdrop.map((tok, i) => (
          <AirdropToken
            token={tok}
            key={tok.address}
            tokenBalance={userTokenAccounts[i]?.balance}
            onClaim={() => {
              setRequestedToken(tok);
            }}
          />
        ))}
      </InnerContainer>
    </>
  );
};
