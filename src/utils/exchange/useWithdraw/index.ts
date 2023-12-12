import { SABER_CODERS, WrappedTokenActions } from "@saberhq/saber-periphery";
import { useSail } from "@saberhq/sail";
import type { Percent } from "@saberhq/token-utils";
import { getOrCreateATAs, TokenAmount } from "@saberhq/token-utils";
import { useConnectedWallet } from "@saberhq/use-solana";
import type { Signer } from "@solana/web3.js";
import { useMemo } from "react";
import invariant from "tiny-invariant";

import type { WrappedToken } from "../../../components/pages/PoolView/Withdraw/wrappedToken";
import { useSDK } from "../../../contexts/sdk";
import { useSettings } from "../../../contexts/settings";
import { useStableSwap } from "../../useStableSwap";
import { useStableSwapTokens } from "../../useStableSwapTokens";
import { calculateWithdrawAll } from "./calculateWithdrawAll";
import { calculateWithdrawOne } from "./calculateWithdrawOne";

export interface IWithdrawal {
  withdrawPoolTokenAmount?: TokenAmount;
  /**
   * If undefined, this is "withdraw all"
   */
  withdrawToken?: WrappedToken;
  /**
   * All wrapped tokens.
   */
  wrappedTokens: WrappedToken[];
}

export interface WithdrawCalculationResult {
  estimates: readonly [TokenAmount | undefined, TokenAmount | undefined];
  minimums: readonly [TokenAmount | undefined, TokenAmount | undefined];
  fees: readonly [TokenAmount | undefined, TokenAmount | undefined];
  feePercents: readonly [Percent | undefined, Percent | undefined];
  slippages: readonly [Percent | undefined, Percent | undefined];
}

export interface IUseWithdraw extends WithdrawCalculationResult {
  handleWithdraw: () => Promise<void>;
  withdrawDisabledReason?: string;
  poolTokenAmount?: TokenAmount;
  withdrawToken?: WrappedToken;
}

const emptyFees = {
  estimates: [undefined, undefined],
  fees: [undefined, undefined],
  feePercents: [undefined, undefined],
  minimums: [undefined, undefined],
  slippages: [undefined, undefined],
} as const;

export const useWithdraw = ({
  withdrawPoolTokenAmount,
  withdrawToken,
  wrappedTokens,
}: IWithdrawal): IUseWithdraw => {
  const wallet = useConnectedWallet();
  const { swap, exchangeInfo, virtualPrice } = useStableSwap();
  const { saber } = useSDK();
  const { handleTX } = useSail();

  const { poolTokenAccount } = useStableSwapTokens();
  const { maxSlippagePercent } = useSettings();

  const { estimates, fees, feePercents, slippages, minimums } = useMemo(() => {
    if (
      !withdrawPoolTokenAmount ||
      withdrawPoolTokenAmount.isZero() ||
      !exchangeInfo
    ) {
      return emptyFees;
    }

    // Withdraw all
    if (withdrawToken === undefined) {
      return calculateWithdrawAll({
        poolTokenAmount: withdrawPoolTokenAmount,
        exchangeInfo,
        maxSlippagePercent,
      });
    }

    if (!virtualPrice) {
      return emptyFees;
    }

    return calculateWithdrawOne({
      exchangeInfo,
      poolTokenAmount: withdrawPoolTokenAmount,
      withdrawToken,
      virtualPrice,
      maxSlippagePercent,
    });
  }, [
    exchangeInfo,
    maxSlippagePercent,
    virtualPrice,
    withdrawPoolTokenAmount,
    withdrawToken,
  ]);

  const handleWithdraw = async () => {
    if (!swap || !wallet) {
      throw new Error("swap or wallet is null");
    }
    if (!poolTokenAccount) {
      throw new Error("no pool token account");
    }
    if (!exchangeInfo) {
      throw new Error("exchange info not loaded");
    }
    if (withdrawPoolTokenAmount === undefined) {
      throw new Error("No withdraw percentage");
    }
    if (minimums[0] === undefined || minimums[1] === undefined) {
      throw new Error("missing minimums");
    }
    invariant(saber, "wallet not connected");

    if (withdrawToken !== undefined) {
      const minimum = minimums[0].token.equals(withdrawToken.value)
        ? minimums[0].toU64()
        : minimums[1].toU64();

      const txEnv = await saber.router
        .createWithdrawOneActionFacade({
          swap,
          inputAmount: withdrawPoolTokenAmount,
          minimumAmountOut: new TokenAmount(
            withdrawToken.isWrapped()
              ? withdrawToken.value
              : withdrawToken.underlying,
            minimum,
          ),
          adWithdrawAction: withdrawToken.isWrapped()
            ? {
                action: "adWithdraw",
                underlying: withdrawToken.underlying,
                decimals: withdrawToken.value.decimals,
                outputToken: withdrawToken.underlying,
              }
            : undefined,
        })
        .manualSSWithdrawOne();
      invariant(txEnv, "transaction envelope not found on withdraw one");

      await handleTX(
        txEnv,
        `Withdraw ${withdrawPoolTokenAmount.format()} LP for ${
          withdrawToken.underlying.symbol
        }`,
      );
    } else {
      const allInstructions = [];
      const {
        accounts: { tokenA: userAccountA, tokenB: userAccountB },
        instructions,
      } = await getOrCreateATAs({
        provider: saber.provider,
        mints: {
          tokenA: exchangeInfo.reserves[0].amount.token.mintAccount,
          tokenB: exchangeInfo.reserves[1].amount.token.mintAccount,
        },
      });

      allInstructions.push(...instructions);

      const allSigners: Signer[] = [];
      allInstructions.push(
        swap.withdraw({
          userAuthority: wallet.publicKey,
          userAccountA,
          userAccountB,
          sourceAccount: poolTokenAccount.key,
          poolTokenAmount: withdrawPoolTokenAmount.toU64(),
          minimumTokenA: minimums[0].toU64(),
          minimumTokenB: minimums[1].toU64(),
        }),
      );

      await Promise.all(
        wrappedTokens.map(async (wTok) => {
          if (wTok.isWrapped()) {
            const action = await WrappedTokenActions.loadWithActions(
              saber.provider,
              SABER_CODERS.AddDecimals.getProgram(saber.provider),
              wTok.underlying,
              wTok.value.decimals,
            );
            const unwrapTx = await action.unwrapAll();
            allInstructions.push(...unwrapTx.instructions);
          }
        }),
      );

      const txEnv = saber.newTx(allInstructions, allSigners);
      await handleTX(txEnv, "Withdraw All");
    }
  };

  const withdrawDisabledReason = !swap
    ? "Loading..."
    : !wallet
      ? "Connect wallet"
      : !poolTokenAccount || poolTokenAccount.balance.isZero()
        ? "Insufficient balance"
        : swap.state.isPaused && withdrawToken !== undefined
          ? "Withdraw one is paused"
          : withdrawPoolTokenAmount === undefined ||
              withdrawPoolTokenAmount.isZero()
            ? "Enter an amount"
            : slippages[0]?.greaterThan(maxSlippagePercent) ||
                slippages[1]?.greaterThan(maxSlippagePercent)
              ? "Price impact too high"
              : undefined;

  return {
    handleWithdraw,
    withdrawDisabledReason,
    estimates,
    minimums,
    slippages,
    fees,
    feePercents,
    poolTokenAmount: withdrawPoolTokenAmount,
    withdrawToken,
  };
};
