import { Saber } from "@saberhq/saber-periphery";
import { useKeypair, useTXHandlers } from "@saberhq/sail";
import type { Token } from "@saberhq/token-utils";
import { Keypair } from "@solana/web3.js";
import React, { useState } from "react";
import invariant from "tiny-invariant";

import { useSDK } from "../../../../contexts/sdk";
import { Tags } from "../../../../utils/builtinTokens";
import { useEnvironment } from "../../../../utils/useEnvironment";
import { AsyncButton } from "../../../common/AsyncButton";
import { BigNumericInput } from "../../../common/inputs/BigNumericInput";
import { LabelWrapper } from "../../../common/LabelWrapper";
import { TokenDropdown } from "../../../common/TokenDropdown";
import { MainLayout } from "../../../layout/MainLayout";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";

export const WrapperCreatorView: React.FC = () => {
  const { saber } = useSDK();
  const { signAndConfirmTX } = useTXHandlers();
  const provider = saber?.provider;

  const [underlying, setUnderlying] = useState<Token | null>(null);

  const [decimalsStr, setDecimalsStr] = useState<string>("8");
  const [mintSignerRaw, setMintSignerRaw] = useState<string>(
    JSON.stringify([...Keypair.generate().secretKey]),
  );

  const mintSigner = useKeypair(mintSignerRaw);

  const initializeDisabledReason = !underlying
    ? "Select underlying token"
    : !mintSigner
      ? "Must specify valid LP mint"
      : null;

  const initializeWrapper = async (): Promise<void> => {
    invariant(underlying, "token a not specified");
    invariant(mintSigner, "lp token mint signer");
    invariant(provider, "provider missing");
    const decimals = parseInt(decimalsStr);
    invariant(underlying.decimals < decimals, "too few decimals");

    const sdk = Saber.load({ provider });

    // check for decimal mismatch
    const wtok = await sdk.router.loadWrappedToken(underlying, decimals);
    invariant(!wtok.wrapped.token, "wrapper already initialized");

    const txEnv = await wtok.createIfNotExists(mintSigner);
    invariant(txEnv, "no creation");
    await signAndConfirmTX(txEnv, "Create token wrapper");
  };

  const { tokens } = useEnvironment();

  const nonDecimalWrappedTokens = tokens.filter(
    (tok) =>
      !tok.info.tags?.includes(Tags.DecimalWrapped) &&
      !tok.info.tags?.includes(Tags.StableSwapLP),
  );

  return (
    <>
      <MainLayout title="Decimal Wrapper Creator" hideOptions>
        <p>Use this page to launch a new decimal token wrapper.</p>
        <InnerContainer>
          <LabelWrapper>
            <span>Token</span>
            <TokenDropdown
              tokens={nonDecimalWrappedTokens}
              onChange={setUnderlying}
              token={underlying}
              allowArbitraryMint
            />
          </LabelWrapper>
          <LabelWrapper>
            <span>Decimals</span>
            <BigNumericInput
              placeholder="Enter an integer..."
              value={decimalsStr}
              onChange={(v) => setDecimalsStr(v)}
            />
          </LabelWrapper>
          <LabelWrapper>
            <span>Mint KP JSON</span>
            <textarea
              onChange={(v) => setMintSignerRaw(v.target.value)}
              value={mintSignerRaw}
            />
          </LabelWrapper>
        </InnerContainer>

        <AsyncButton
          size="large"
          disabled={initializeDisabledReason !== null}
          onClick={() => {
            void initializeWrapper();
          }}
        >
          {initializeDisabledReason ?? "Initialize Pool"}
        </AsyncButton>
        {mintSigner?.publicKey.toString()}
      </MainLayout>
    </>
  );
};
