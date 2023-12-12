import {
  Saber,
  SABER_CODERS,
  WrappedTokenActions,
} from "@saberhq/saber-periphery";
import { useSail } from "@saberhq/sail";
import type { TransactionEnvelope } from "@saberhq/solana-contrib";
import type { IExchangeInfo, StableSwap } from "@saberhq/stableswap-sdk";
import {
  calculateEstimatedMintAmount,
  calculateVirtualPrice,
} from "@saberhq/stableswap-sdk";
import {
  Fraction,
  getOrCreateATAs,
  NATIVE_MINT,
  Percent,
  TokenAmount,
  ZERO,
} from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import type { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import invariant from "tiny-invariant";

import { useSettings } from "../../../contexts/settings";
import { useStableSwap } from "../../useStableSwap";
import { useStableSwapTokens } from "../../useStableSwapTokens";
import { createEphemeralWrappedSolAccount } from "../../wrappedSol";
import { calculateDepositSlippage } from "./calculateDepositSlippage";

interface IDeposit {
  tokenAmounts: readonly TokenAmount[];
}

export interface IUseDeposit {
  handleDeposit: (saber: Saber) => Promise<void>;
  depositDisabledReason?: string;
  priceImpact: Percent | null;
  estimatedDepositSlippage: Percent | null;
  estimatedMint: ReturnType<typeof calculateEstimatedMintAmount> | null;
}

export const useDeposit = ({ tokenAmounts }: IDeposit): IUseDeposit => {
  const wallet = useConnectedWallet();
  const { swap, exchangeInfo } = useStableSwap();

  // tokens may still be in wrapped form
  const { wrappedTokens, underlyingTokenAccounts } = useStableSwapTokens();
  const { handleTX } = useSail();

  const { maxSlippagePercent } = useSettings();

  // token amounts wrapped back to their wrapped token
  const tokenAmountsWrapped = useMemo(() => {
    return tokenAmounts.map((amount, i) => {
      return wrappedTokens[i]?.wrappedAmount(amount) ?? amount;
    });
  }, [tokenAmounts, wrappedTokens]);

  // estimated number of tokens minted from a deposit
  const estimatedMint = useMemo(() => {
    if (!exchangeInfo) {
      return null;
    }

    const [amountA, amountB] = tokenAmountsWrapped;
    try {
      return calculateEstimatedMintAmount(
        exchangeInfo,
        amountA?.raw ?? ZERO,
        amountB?.raw ?? ZERO,
      );
    } catch (e) {
      console.warn("Ignoring mint estimation calculation error", e);
    }

    return null;
  }, [exchangeInfo, tokenAmountsWrapped]);

  // price impact is the % change on price you'll be getting
  // compared to the expected price, which is 1 LP = 1 token
  const priceImpact: Percent | null = useMemo(() => {
    if (!exchangeInfo || !estimatedMint) {
      return null;
    }

    // total tokens to swap
    const totalTokens = tokenAmountsWrapped.reduce(
      (acc, amt) => acc.add(amt.asFraction),
      new Fraction(0),
    );
    if (totalTokens.isZero()) {
      return new Percent(0);
    }

    // pool token virtual price
    const virtualPrice = calculateVirtualPrice(exchangeInfo);

    // estimated mint amount if there were no slippage
    const expectedMint = virtualPrice
      ? totalTokens.divide(virtualPrice)
      : new Fraction(0);

    return new Percent(1).subtract(
      estimatedMint.mintAmount.asFraction.divide(expectedMint),
    );
  }, [estimatedMint, exchangeInfo, tokenAmountsWrapped]);

  const estimatedDepositSlippage = useMemo(() => {
    if (!exchangeInfo) {
      return null;
    }

    const [amountA, amountB] = tokenAmountsWrapped;
    return calculateDepositSlippage(
      exchangeInfo,
      amountA?.raw ?? ZERO,
      amountB?.raw ?? ZERO,
    );
  }, [exchangeInfo, tokenAmountsWrapped]);

  const depositDisabledReason = !swap
    ? "Loading..."
    : !wallet
      ? "Connect wallet"
      : swap.state.isPaused
        ? "Pool is paused"
        : tokenAmounts.find((amount, i) =>
              amount.greaterThan(underlyingTokenAccounts[i]?.balance ?? 0),
            )
          ? "Insufficient balance"
          : tokenAmounts.every((amount) => amount.isZero()) ||
              tokenAmounts.length === 0
            ? "Enter an amount"
            : estimatedDepositSlippage?.greaterThan(maxSlippagePercent)
              ? "Price impact too high"
              : undefined;

  const handleSolDeposit = useCallback(
    async (
      saber: Saber,
      swap: StableSwap,
      exchangeInfo: IExchangeInfo,
      mints: {
        lp: PublicKey;
        tokenA: PublicKey;
        tokenB: PublicKey;
      },
    ): Promise<void> => {
      const allInstructions = [];
      // create ATAs if they don't exist
      const result = await getOrCreateATAs({
        provider: saber.provider,
        mints,
      });
      if (result.createAccountInstructions.lp) {
        allInstructions.push(result.createAccountInstructions.lp);
      }
      if (result.createAccountInstructions.tokenA) {
        allInstructions.push(result.createAccountInstructions.tokenA);
      }
      if (result.createAccountInstructions.tokenB) {
        allInstructions.push(result.createAccountInstructions.tokenB);
      }

      const [amountA, amountB] = tokenAmountsWrapped;
      invariant(amountA && amountB, "amounts missing");

      const [amountAInput, amountBInput] = tokenAmounts;
      invariant(amountAInput && amountBInput, "input amounts missing");

      // Create an ephemeral account for wrapped SOL
      const ephemeralAccount = Keypair.generate();
      const { init, accountKey, close } =
        await createEphemeralWrappedSolAccount({
          provider: saber.provider,
          amount: mints.tokenA.equals(NATIVE_MINT) ? amountA : amountB,
          accountKP: ephemeralAccount,
        });
      allInstructions.push(...init.instructions);

      let minimumPoolTokenAmount = new TokenAmount(
        exchangeInfo.lpTotalSupply.token,
        0,
      );
      try {
        const estimatedMint = calculateEstimatedMintAmount(
          exchangeInfo,
          amountA.raw,
          amountB.raw,
        );

        // minimum lp token amount to receive from the deposit, considering slippage
        minimumPoolTokenAmount =
          estimatedMint.mintAmount.reduceBy(maxSlippagePercent);
      } catch (e) {
        //
      }

      allInstructions.push(
        swap.deposit({
          userAuthority: saber.provider.wallet.publicKey,
          sourceA: mints.tokenA.equals(NATIVE_MINT)
            ? accountKey
            : result.accounts.tokenA,
          sourceB: mints.tokenB.equals(NATIVE_MINT)
            ? accountKey
            : result.accounts.tokenB,
          poolTokenAccount: result.accounts.lp,
          tokenAmountA: amountA.toU64(),
          tokenAmountB: amountB.toU64(),
          minimumPoolTokenAmount: minimumPoolTokenAmount.toU64(),
        }),
      );

      // Close the ephemeral account for wrapped SOL
      allInstructions.push(...close.instructions);

      const txEnv: TransactionEnvelope = saber.newTx(allInstructions, [
        ephemeralAccount,
      ]);

      await handleTX(
        txEnv,
        `Deposit ${tokenAmounts
          .filter((ta) => !ta.isZero())
          .map((ta) => `${ta.format()} ${ta.token.symbol}`)
          .join(", ")} for ${exchangeInfo.lpTotalSupply.token.name}`,
      );
    },
    [handleTX, maxSlippagePercent, tokenAmounts, tokenAmountsWrapped],
  );

  const handleDeposit = useCallback(
    async (saber: Saber): Promise<void> => {
      if (!swap || !exchangeInfo) {
        throw new Error("swap or wallet or exchangeInfo is null");
      }

      const mints = {
        lp: exchangeInfo.lpTotalSupply.token.mintAccount,
        tokenA: exchangeInfo.reserves[0].amount.token.mintAccount,
        tokenB: exchangeInfo.reserves[1].amount.token.mintAccount,
      };

      if (
        mints.tokenA.equals(NATIVE_MINT) ||
        mints.tokenB.equals(NATIVE_MINT)
      ) {
        return await handleSolDeposit(
          Saber.load({ provider: saber.provider }),
          swap,
          exchangeInfo,
          mints,
        );
      }

      const allInstructions = [];
      // create pool token account if it doesn't exist
      const result = await getOrCreateATAs({
        provider: saber.provider,
        mints,
      });
      if (result.createAccountInstructions.lp) {
        allInstructions.push(result.createAccountInstructions.lp);
      }

      const [amountA, amountB] = tokenAmountsWrapped;
      invariant(amountA && amountB, "amounts missing");

      const [amountAInput, amountBInput] = tokenAmounts;
      invariant(amountAInput && amountBInput, "input amounts missing");

      if (!amountA.isZero() && !amountA.token.equals(amountAInput.token)) {
        const aWrapped = await WrappedTokenActions.loadWithActions(
          saber.provider,
          SABER_CODERS.AddDecimals.getProgram(saber.provider),
          amountAInput.token,
          amountA.token.decimals,
        );
        const doWrap = await aWrapped.wrap(amountAInput);
        allInstructions.push(...doWrap.instructions);
      } else if (result.createAccountInstructions.tokenA) {
        allInstructions.push(result.createAccountInstructions.tokenA);
      }

      if (!amountB.isZero() && !amountB.token.equals(amountBInput.token)) {
        const bWrapped = await WrappedTokenActions.loadWithActions(
          saber.provider,
          SABER_CODERS.AddDecimals.getProgram(saber.provider),
          amountBInput.token,
          amountB.token.decimals,
        );
        const doWrap = await bWrapped.wrap(amountBInput);
        allInstructions.push(...doWrap.instructions);
      } else if (result.createAccountInstructions.tokenB) {
        allInstructions.push(result.createAccountInstructions.tokenB);
      }

      let minimumPoolTokenAmount = new TokenAmount(
        exchangeInfo.lpTotalSupply.token,
        0,
      );
      try {
        const estimatedMint = calculateEstimatedMintAmount(
          exchangeInfo,
          amountA.raw,
          amountB.raw,
        );

        // minimum lp token amount to receive from the deposit, considering slippage
        minimumPoolTokenAmount =
          estimatedMint.mintAmount.reduceBy(maxSlippagePercent);
      } catch (e) {
        //
      }

      allInstructions.push(
        swap.deposit({
          userAuthority: saber.provider.wallet.publicKey,
          sourceA: result.accounts.tokenA,
          sourceB: result.accounts.tokenB,
          poolTokenAccount: result.accounts.lp,
          tokenAmountA: amountA.toU64(),
          tokenAmountB: amountB.toU64(),
          minimumPoolTokenAmount: minimumPoolTokenAmount.toU64(),
        }),
      );

      const txEnv: TransactionEnvelope = saber.newTx(allInstructions);

      await handleTX(
        txEnv,
        `Deposit ${tokenAmounts
          .filter((ta) => !ta.isZero())
          .map((ta) => `${ta.format()} ${ta.token.symbol}`)
          .join(", ")} for ${exchangeInfo.lpTotalSupply.token.name}`,
      );
    },
    [
      exchangeInfo,
      handleSolDeposit,
      handleTX,
      maxSlippagePercent,
      swap,
      tokenAmounts,
      tokenAmountsWrapped,
    ],
  );

  return {
    handleDeposit,
    depositDisabledReason,
    priceImpact,
    estimatedMint,
    estimatedDepositSlippage,
  };
};
