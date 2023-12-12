import { useSail } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import { TokenAccountLayout } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token as SPLToken,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import React, { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { styled } from "twin.macro";

import { useSDK } from "../../../../contexts/sdk";
import { useEnvironment } from "../../../../utils/useEnvironment";
import { Button } from "../../../common/Button";
import { TokenDropdown } from "../../../common/TokenDropdown";
import { MainLayout } from "../../../layout/MainLayout";
import { SubLayout } from "../../../layout/SubLayout";

export const TokenAccountCreatorView: React.FC = () => {
  const [key, setKey] = useState<string>("");
  const [token, setToken] = useState<Token | null>(null);
  const [ata, setATA] = useState<PublicKey | null>(null);
  const wallet = useConnectedWallet();
  const { saber } = useSDK();
  const { handleTX } = useSail();
  useEffect(() => {
    const me = wallet?.publicKey;
    if (me) {
      setKey(me.toString());
    }
  }, [wallet]);

  const owner = useMemo(() => {
    try {
      return new PublicKey(key);
    } catch (e) {
      return null;
    }
  }, [key]);
  useEffect(() => {
    void (async () => {
      if (!token || !owner) {
        setATA(null);
        return;
      }
      setATA(
        await SPLToken.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          token.mintAccount,
          owner,
        ),
      );
    })();
  }, [owner, token]);

  const { tokens } = useEnvironment();

  return (
    <MainLayout title="Token Account Creator">
      <SubLayout title="Create Account">
        <LabelWrapper>
          <span>Token</span>
          <TokenDropdown tokens={tokens} onChange={setToken} token={token} />
        </LabelWrapper>
        <LabelWrapper>
          <span>Owner</span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </LabelWrapper>
        <LabelWrapper>
          <span>ATA</span>
          <p>{ata?.toString() ?? "--"}</p>
        </LabelWrapper>
        <LabelWrapper>
          <Button
            onClick={async () => {
              if (!saber) {
                throw new Error("saber not loaded");
              }
              invariant(token, "token not loaded");
              const kp = Keypair.generate();
              await handleTX(
                saber.newTx(
                  [
                    SystemProgram.createAccount({
                      fromPubkey: saber.provider.wallet.publicKey,
                      newAccountPubkey: kp.publicKey,
                      space: TokenAccountLayout.span,
                      lamports:
                        await SPLToken.getMinBalanceRentForExemptAccount(
                          saber.provider.connection,
                        ),
                      programId: TOKEN_PROGRAM_ID,
                    }),
                    SPLToken.createInitAccountInstruction(
                      TOKEN_PROGRAM_ID,
                      token.mintAccount,
                      kp.publicKey,
                      saber.provider.wallet.publicKey,
                    ),
                  ],
                  [kp],
                ),
                `Create token account ${kp.publicKey.toString()} for token ${
                  token.symbol
                }`,
              );
            }}
          >
            Create Random Account
          </Button>
        </LabelWrapper>
      </SubLayout>
    </MainLayout>
  );
};

const LabelWrapper = styled.div`
  :not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
  display: grid;
  grid-template-columns: 50% 50%;
  align-items: center;
  padding: 12px 0;
  & > span {
    font-size: 16px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.bold};
  }
`;
