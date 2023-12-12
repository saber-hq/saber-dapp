import type { PoolData } from "@saberhq/pool-manager";
import { useKeypair, useTXHandlers, useUserATAs } from "@saberhq/sail";
import type { StableSwap } from "@saberhq/stableswap-sdk";
import type { Token } from "@saberhq/token-utils";
import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { mapValues } from "lodash-es";
import React, { useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import invariant from "tiny-invariant";
import { css } from "twin.macro";

import { useSDK } from "../../../contexts/sdk";
import { Tags } from "../../../utils/builtinTokens";
import createPool from "../../../utils/createPool";
import { formatPercent } from "../../../utils/format";
import { useEnvironment } from "../../../utils/useEnvironment";
import { AsyncButton } from "../../common/AsyncButton";
import { AttributeList } from "../../common/AttributeList";
import { InfoCard } from "../../common/cards/InfoCard";
import { BigNumericInput } from "../../common/inputs/BigNumericInput";
import { LabelWrapper } from "../../common/LabelWrapper";
import { TokenAmountSelector } from "../../common/TokenAmountSelector";
import { InnerContainer } from "../../layout/MainLayout/PageContainer";
import { PageWidthContainer } from "../../layout/MainLayout/PageLayout";
import { SubLayout } from "../../layout/SubLayout";

export const PoolCreateViewInner: React.FC = () => {
  const { saber } = useSDK();
  const provider = saber?.provider;

  const { signAndConfirmTXs } = useTXHandlers();
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [uiTokenAAmount, setUIFromAmount] = useState<string>("");
  const [uiTokenBAmount, setUIToAmount] = useState<string>("");

  const [sourceAccountA, sourceAccountB] = useUserATAs(tokenA, tokenB);

  const [a, setA] = useState<string>("10");
  const [lpTokenMintSignerRaw, setLpTokenMintSignerRaw] = useState<string>(
    JSON.stringify([...Keypair.generate().secretKey]),
  );
  const lpTokenMintSigner = useKeypair(lpTokenMintSignerRaw);

  const [swapAccountKPRaw, setSwapAccountKPRaw] = useState<string>(
    JSON.stringify([...Keypair.generate().secretKey]),
  );
  const swapAccountSigner = useKeypair(swapAccountKPRaw);

  const initializeDisabledReason =
    !tokenA || !tokenB
      ? "Select both tokens"
      : !sourceAccountA || !sourceAccountB
        ? "No tokens"
        : !lpTokenMintSigner
          ? "Must specify valid LP mint"
          : null;

  const [poolCreated, setPoolCreated] = useState<PoolData | null>(null);
  const [poolKey, setPoolKey] = useState<PublicKey | null>(null);
  const [swapCreated, setSwapCreated] = useState<StableSwap | null>(null);

  const initializePool = async (): Promise<void> => {
    invariant(tokenA, "token a not specified");
    invariant(tokenB, "token b not specified");
    invariant(swapAccountSigner, "sdk missing");
    invariant(lpTokenMintSigner, "lp token mint signer");
    invariant(sourceAccountA, "source account a empty");
    invariant(sourceAccountB, "source account b empty");
    invariant(provider, "provider missing");
    invariant(saber, "sdk missing");

    const newPoolAndSwap = await createPool({
      a,
      tokenA,
      tokenB,
      swapAccountSigner,
      lpTokenMintSigner,
      sourceAccountA,
      sourceAccountB,
      provider,
      saber,
      tokenAAmount: uiTokenAAmount,
      tokenBAmount: uiTokenBAmount,
      signAndConfirmTXs,
    });

    if (newPoolAndSwap !== null) {
      const { poolData, poolKey, stableSwap } = newPoolAndSwap;
      setPoolCreated(poolData);
      setPoolKey(poolKey);
      setSwapCreated(stableSwap);
    }
  };

  const { tokens } = useEnvironment();

  const selectableTokens = tokens.filter(
    (token) => !token.hasTag(Tags.StableSwapLP),
  );

  return (
    <PageWidthContainer tw="grid gap-6">
      <InfoCard>
        <h2>Create a new pool on Saber</h2>
        <p>
          Saber allows you to create a highly concentrated, highly networked
          pool of liquidity for any pair of assets.
        </p>
        <a
          href="https://docs.saber.so/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>Learn more</span>
          <FaExternalLinkAlt />
        </a>
      </InfoCard>
      <InnerContainer>
        <TokenAmountSelector
          css={css`
            margin-bottom: 24px;
          `}
          tokens={selectableTokens}
          onSelect={setTokenA}
          selectedValue={tokenA}
          inputValue={uiTokenAAmount}
          inputOnChange={setUIFromAmount}
          currentAmount={{
            amount: sourceAccountA?.balance,
            allowSelect: true,
          }}
          allowArbitraryMint
        />
        <TokenAmountSelector
          tokens={selectableTokens}
          onSelect={setTokenB}
          selectedValue={tokenB}
          inputValue={uiTokenBAmount}
          inputOnChange={setUIToAmount}
          currentAmount={{
            amount: sourceAccountB?.balance,
            allowSelect: true,
          }}
          allowArbitraryMint
        />
      </InnerContainer>
      <InnerContainer>
        <LabelWrapper>
          <span>Concentration</span>
          <BigNumericInput
            placeholder="0.00"
            value={a}
            onChange={(v) => setA(v)}
          />
        </LabelWrapper>
        <LabelWrapper>
          <span>Swap account KP JSON</span>
          <textarea
            onChange={(v) => setSwapAccountKPRaw(v.target.value)}
            value={swapAccountKPRaw}
          />
        </LabelWrapper>
        <LabelWrapper>
          <span>LP mint KP JSON</span>
          <textarea
            onChange={(v) => setLpTokenMintSignerRaw(v.target.value)}
            value={lpTokenMintSignerRaw}
          />
        </LabelWrapper>
        <AttributeList
          attributes={{
            "Swap Account": swapAccountSigner?.publicKey,
            "LP Mint": lpTokenMintSigner?.publicKey,
          }}
        />
      </InnerContainer>

      <AsyncButton
        size="large"
        disabled={initializeDisabledReason !== null}
        onClick={async () => {
          await initializePool();
        }}
      >
        {initializeDisabledReason ?? "Initialize Pool"}
      </AsyncButton>
      {poolCreated && swapCreated && (
        <SubLayout title="Pool Created">
          <AttributeList
            attributes={{
              TokenAMint: swapCreated.state.tokenA.mint,
              TokenBMint: swapCreated.state.tokenB.mint,
              SwapAddress: swapCreated.config.swapAccount,
              ProgramID: swapCreated.config.swapProgramID,
              Fees: Object.entries(
                mapValues(swapCreated.state.fees, formatPercent),
              )
                .map(([fee, value]) => `${fee}: ${value.toString()}`)
                .join("\n"),
              AdminAccount: swapCreated.state.adminAccount,
              LPTokenMint: swapCreated.state.poolTokenMint,
              AdminFeeAccountA: swapCreated.state.tokenA.adminFeeAccount,
              AdminFeeAccountB: swapCreated.state.tokenB.adminFeeAccount,
              PoolKey: poolKey,
              PoolManager: poolCreated.manager,
            }}
          />
        </SubLayout>
      )}
    </PageWidthContainer>
  );
};
