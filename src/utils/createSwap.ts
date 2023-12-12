import {
  LazyWrappedToken,
  Saber,
  WrappedToken,
} from "@saberhq/saber-periphery";
import type { AssociatedTokenAccount, UseHandleTXs } from "@saberhq/sail";
import type { Provider, SendTxRequest } from "@saberhq/solana-contrib";
import { TransactionEnvelope } from "@saberhq/solana-contrib";
import type {
  Fees,
  InitializeNewStableSwapArgs,
  InitializeSwapInstruction,
  StableSwap,
} from "@saberhq/stableswap-sdk";
import {
  createInitializeStableSwapInstructions,
  loadSwapFromInitializeArgs,
  SWAP_PROGRAM_ID,
  ZERO_FEES,
} from "@saberhq/stableswap-sdk";
import type { TransactionInstructions } from "@saberhq/stableswap-sdk/dist/cjs/util/instructions";
import type { Token } from "@saberhq/token-utils";
import { Percent, TokenAmount } from "@saberhq/token-utils";
import {
  NATIVE_MINT,
  Token as SPLToken,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import type { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { mapValues } from "lodash-es";

import { ADMIN_ACCOUNT } from "./constants";
import { formatPercent } from "./format";
import { notify } from "./notifications";
import { wrapAndSendSOLToATA } from "./wrappedSol";

const transactionInstructionsToTXs = (
  provider: Provider,
  { instructions, signers }: TransactionInstructions,
): TransactionEnvelope =>
  new TransactionEnvelope(
    provider,
    [...instructions],
    [...(signers ?? []).filter((s): s is Signer => !!s)],
  );

export type InitializeStableSwapArgs = {
  initializeArgs: InitializeSwapInstruction;
  /**
   * Lamports needed to be rent exempt.
   */
  balanceNeeded: number;

  instructions: {
    /**
     * Create accounts for the LP token
     */
    createLPTokenMint: TransactionInstructions;
    /**
     * Create LP token account for the initial LP
     */
    createInitialLPTokenAccount: TransactionInstructions;
    /**
     * Create accounts for swap token A
     */
    createSwapTokenAAccounts: TransactionInstructions;
    /**
     * Create accounts for swap token B
     */
    createSwapTokenBAccounts: TransactionInstructions;
    /**
     * Seed the accounts for the pool
     */
    seedPoolAccounts: TransactionInstructions;
    /**
     * Initialize the swap
     */
    initializeSwap: TransactionInstructions;
  };
};

export const setupInitStableSwapInstructions = async ({
  a,
  tokenA,
  tokenB,
  swapAccountSigner,
  lpTokenMintSigner,
  sourceAccountA,
  sourceAccountB,
  provider,
  saber,
  tokenAAmount,
  tokenBAmount,
  handleTX,
}: {
  a: string;
  tokenA: Token;
  tokenB: Token;
  swapAccountSigner: Keypair;
  lpTokenMintSigner: Keypair;
  sourceAccountA: AssociatedTokenAccount;
  sourceAccountB: AssociatedTokenAccount;
  provider: Provider;
  saber: Saber;
  tokenAAmount: string;
  tokenBAmount: string;
  handleTX: UseHandleTXs["handleTX"];
}): Promise<InitializeStableSwapArgs | null> => {
  const owner = provider.wallet.publicKey;

  const parsedA = new u64(a);
  const initialAmountA = TokenAmount.parse(tokenA, tokenAAmount);
  const initialAmountB = TokenAmount.parse(tokenB, tokenBAmount);

  let sourceAccountAKey = sourceAccountA.key;
  let sourceAccountBKey = sourceAccountB.key;
  let tokenAMint: PublicKey = tokenA.mintAccount;
  let tokenBMint: PublicKey = tokenB.mintAccount;
  let initialAmountAU64 = initialAmountA.toU64();
  let initialAmountBU64 = initialAmountB.toU64();

  let initTX: TransactionEnvelope = saber.newTx([]);

  // we need to use an ephemeral account here
  // until syncnative is supported properly
  if (tokenA.mintAccount.equals(NATIVE_MINT)) {
    const initA = await wrapAndSendSOLToATA({
      provider,
      amount: initialAmountA,
    });
    initTX = initTX.combine(initA);
  }
  if (tokenB.mintAccount.equals(NATIVE_MINT)) {
    const initB = await wrapAndSendSOLToATA({
      provider,
      amount: initialAmountA,
    });
    initTX = initTX.combine(initB);
  }

  if (initTX.instructions.length > 0) {
    const { success } = await handleTX(initTX, "Wrapping SOL");
    if (!success) {
      return null;
    }
  }

  // check for decimal mismatch
  if (tokenA.decimals !== tokenB.decimals) {
    const underlyingAmount =
      tokenA.decimals > tokenB.decimals ? initialAmountB : initialAmountA;
    const decimals = Math.max(tokenA.decimals, tokenB.decimals);
    const wtok = await saber.router.loadWrappedToken(
      underlyingAmount.token,
      decimals,
    );
    if (wtok.wrapped instanceof LazyWrappedToken) {
      notify({
        message: `Wrapped token for ${underlyingAmount.token.symbol} (${decimals} decimals) does not exist`,
        description: "Please create a wrapped token before continuing.",
      });
      throw new Error();
    }

    const wrapped = wtok.wrapped as WrappedToken;
    // if (!(wrapped instanceof WrappedToken)) {
    //   notify({
    //     message: `Wrapped token for ${underlyingAmount.token.symbol} (${decimals} decimals) does not exist`,
    //     description: "Please create a wrapped token before continuing.",
    //   });
    //   throw new Error();
    // }

    const txEnv = await wtok.wrap(underlyingAmount);
    await handleTX(
      txEnv,
      `Wrapping ${underlyingAmount.format()} ${underlyingAmount.token.symbol}`,
    );

    if (underlyingAmount.token.equals(tokenA)) {
      tokenAMint = wrapped.mintAccount;
      sourceAccountAKey = await wtok.getAssociatedTokenAddress();
      initialAmountAU64 = initialAmountA
        .toU64()
        .mul(new u64(10 ** (decimals - initialAmountA.token.decimals)));
    } else {
      tokenBMint = wrapped.mintAccount;
      sourceAccountBKey = await wtok.getAssociatedTokenAddress();
      initialAmountBU64 = initialAmountB
        .toU64()
        .mul(new u64(10 ** (decimals - initialAmountB.token.decimals)));
    }
  }

  const fees: Fees = {
    ...ZERO_FEES,
    trade: new Percent(4, 10_000),
  };

  const args: InitializeNewStableSwapArgs = {
    provider,
    swapProgramID: SWAP_PROGRAM_ID,
    seedPoolAccounts: ({ tokenAAccount, tokenBAccount }) => {
      return {
        instructions: [
          SPLToken.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            sourceAccountAKey,
            tokenAAccount,
            owner,
            [],
            new u64(initialAmountAU64.toString()),
          ),
          SPLToken.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            sourceAccountBKey,
            tokenBAccount,
            owner,
            [],
            new u64(initialAmountBU64.toString()),
          ),
        ],
        signers: [],
      };
    },

    tokenAMint,
    tokenBMint,
    adminAccount: ADMIN_ACCOUNT,
    ampFactor: parsedA,
    fees,

    swapAccountSigner,
    poolTokenMintSigner: lpTokenMintSigner,

    initialLiquidityProvider: owner,
    useAssociatedAccountForInitialLP: true,
  };

  return await createInitializeStableSwapInstructions(args);
};

export const createInitialSwapAccounts = async ({
  args,
  provider,
  handleTXs,
}: {
  args: InitializeStableSwapArgs;
  provider: Provider;
  handleTXs: UseHandleTXs["handleTXs"];
}) => {
  const { instructions } = args;
  const {
    createLPTokenMint,
    createSwapTokenAAccounts,
    createSwapTokenBAccounts,
  } = instructions;

  const txs = [
    createLPTokenMint,
    createSwapTokenAAccounts,
    createSwapTokenBAccounts,
  ].map(({ instructions, signers }) =>
    transactionInstructionsToTXs(provider, { instructions, signers }),
  );

  const { success } = await handleTXs(txs, "Create initial accounts");
  if (!success) {
    return null;
  }
  // await Promise.all(pending.map((p) => p.wait()));
};

export const seedAccounts = async ({
  args,
  provider,
  handleTXs,
}: {
  args: InitializeStableSwapArgs;
  provider: Provider;
  handleTXs: UseHandleTXs["handleTXs"];
}) => {
  const { instructions } = args;
  const { createInitialLPTokenAccount, seedPoolAccounts } = instructions;

  const txs = [createInitialLPTokenAccount, seedPoolAccounts].map(
    ({ instructions, signers }) =>
      transactionInstructionsToTXs(provider, { instructions, signers }),
  );

  const { success } = await handleTXs(txs, "Seed accounts");
  if (!success) {
    return null;
  }
  // await Promise.all(pending.map((p) => p.wait()));
};

export const initSwap = async ({
  args,
  provider,
  handleTX,
}: {
  args: InitializeStableSwapArgs;
  provider: Provider;
  handleTX: UseHandleTXs["handleTX"];
}): Promise<StableSwap | null> => {
  const { instructions, initializeArgs } = args;
  const { initializeSwap } = instructions;

  const tx = transactionInstructionsToTXs(provider, {
    instructions: initializeSwap.instructions,
    signers: initializeSwap.signers,
  });

  const { pending, success } = await handleTX(tx, "Initialize swap");
  if (!success || !pending) {
    return null;
  }
  // await pending.wait();

  notify({ message: "Pool created. Check the console for more details." });

  const { fees, tokenA, tokenB } = initializeArgs;
  const newSwap = loadSwapFromInitializeArgs(initializeArgs);
  console.log(
    JSON.stringify(
      {
        TokenAMint: tokenA.mint.toString(),
        TokenBMint: tokenB.mint.toString(),
        SwapAddress: newSwap.config.swapAccount.toString(),
        ProgramID: newSwap.config.swapProgramID.toString(),
        Fees: mapValues(fees, formatPercent),
        AdminAccount: newSwap.state.adminAccount.toString(),
        LPTokenMint: newSwap.state.poolTokenMint.toString(),
        AdminFeeAccountA: newSwap.state.tokenA.adminFeeAccount.toString(),
        AdminFeeAccountB: newSwap.state.tokenB.adminFeeAccount.toString(),
      },
      null,
      2,
    ),
  );

  return newSwap;
};

export default async function createSwap({
  a,
  tokenA,
  tokenB,
  swapAccountSigner,
  lpTokenMintSigner,
  sourceAccountA,
  sourceAccountB,
  provider,
  saber,
  tokenAAmount,
  tokenBAmount,
  handleTX,
  handleTXs,
}: {
  a: string;
  tokenA: Token;
  tokenB: Token;
  swapAccountSigner: Keypair;
  lpTokenMintSigner: Keypair;
  sourceAccountA: AssociatedTokenAccount;
  sourceAccountB: AssociatedTokenAccount;
  provider: Provider;
  saber: Saber;
  tokenAAmount: string;
  tokenBAmount: string;
  handleTX: UseHandleTXs["handleTX"];
  handleTXs: UseHandleTXs["handleTXs"];
}): Promise<StableSwap | null> {
  const owner = provider.wallet.publicKey;

  const parsedA = new u64(a);
  const initialAmountA = TokenAmount.parse(tokenA, tokenAAmount);
  const initialAmountB = TokenAmount.parse(tokenB, tokenBAmount);

  let sourceAccountAKey = sourceAccountA.key;
  let sourceAccountBKey = sourceAccountB.key;
  let tokenAMint: PublicKey = tokenA.mintAccount;
  let tokenBMint: PublicKey = tokenB.mintAccount;
  let initialAmountAU64 = initialAmountA.toU64();
  let initialAmountBU64 = initialAmountB.toU64();

  let initTX: TransactionEnvelope = saber.newTx([]);

  // we need to use an ephemeral account here
  // until syncnative is supported properly
  if (tokenA.mintAccount.equals(NATIVE_MINT)) {
    const initA = await wrapAndSendSOLToATA({
      provider,
      amount: initialAmountA,
    });
    initTX = initTX.combine(initA);
  }
  if (tokenB.mintAccount.equals(NATIVE_MINT)) {
    const initB = await wrapAndSendSOLToATA({
      provider,
      amount: initialAmountA,
    });
    initTX = initTX.combine(initB);
  }

  if (initTX.instructions.length > 0) {
    const { success } = await handleTX(initTX, "Wrapping SOL");
    if (!success) {
      return null;
    }
  }

  // check for decimal mismatch
  if (tokenA.decimals !== tokenB.decimals) {
    const underlyingAmount =
      tokenA.decimals > tokenB.decimals ? initialAmountB : initialAmountA;
    const decimals = Math.max(tokenA.decimals, tokenB.decimals);
    const { router } = Saber.load({ provider: saber.provider });
    const wtok = await router.loadWrappedToken(
      underlyingAmount.token,
      decimals,
    );
    const { wrapped } = wtok;
    if (!(wrapped instanceof WrappedToken)) {
      notify({
        message: `Wrapped token for ${underlyingAmount.token.symbol} (${decimals} decimals) does not exist`,
        description: "Please create a wrapped token before continuing.",
      });
      throw new Error();
      return null;
    }

    const txEnv = await wtok.wrap(underlyingAmount);
    await handleTX(
      txEnv,
      `Wrapping ${underlyingAmount.format()} ${underlyingAmount.token.symbol}`,
    );

    if (underlyingAmount.token.equals(tokenA)) {
      tokenAMint = wrapped.mintAccount;
      sourceAccountAKey = await wtok.getAssociatedTokenAddress();
      initialAmountAU64 = initialAmountA
        .toU64()
        .mul(new u64(10 ** (decimals - initialAmountA.token.decimals)));
    } else {
      tokenBMint = wrapped.mintAccount;
      sourceAccountBKey = await wtok.getAssociatedTokenAddress();
      initialAmountBU64 = initialAmountB
        .toU64()
        .mul(new u64(10 ** (decimals - initialAmountB.token.decimals)));
    }
  }

  const fees: Fees = {
    ...ZERO_FEES,
    trade: new Percent(4, 10_000),
  };

  const args: InitializeNewStableSwapArgs = {
    provider,
    swapProgramID: SWAP_PROGRAM_ID,
    seedPoolAccounts: ({ tokenAAccount, tokenBAccount }) => {
      return {
        instructions: [
          SPLToken.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            sourceAccountAKey,
            tokenAAccount,
            owner,
            [],
            new u64(initialAmountAU64.toString()),
          ),
          SPLToken.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            sourceAccountBKey,
            tokenBAccount,
            owner,
            [],
            new u64(initialAmountBU64.toString()),
          ),
        ],
        signers: [],
      };
    },

    tokenAMint,
    tokenBMint,
    adminAccount: ADMIN_ACCOUNT,
    ampFactor: parsedA,
    fees,

    swapAccountSigner,
    poolTokenMintSigner: lpTokenMintSigner,

    initialLiquidityProvider: owner,
    useAssociatedAccountForInitialLP: true,
  };

  const { instructions, initializeArgs } =
    await createInitializeStableSwapInstructions(args);

  const [
    createLPTokenMint,
    createSwapTokenAAccounts,
    createSwapTokenBAccounts,
    createInitialLPTokenAccount,
    seedPoolAccounts,
    initializeSwap,
  ] = (
    [
      "createLPTokenMint",
      "createSwapTokenAAccounts",
      "createSwapTokenBAccounts",
      "createInitialLPTokenAccount",
      "seedPoolAccounts",
      "initializeSwap",
    ] as const
  ).map((method) => {
    const sdk = Saber.load({
      provider,
    });
    const inst = instructions[method];
    const tx = sdk.newTx(inst.instructions.slice());

    return { tx: tx.build(), signers: inst.signers.slice() };
  }) as [
    SendTxRequest,
    SendTxRequest,
    SendTxRequest,
    SendTxRequest,
    SendTxRequest,
    SendTxRequest,
  ];

  const reqsToTXs = ({ tx, signers }: SendTxRequest): TransactionEnvelope =>
    new TransactionEnvelope(
      provider,
      [...tx.instructions],
      [...(signers ?? []).filter((s): s is Signer => !!s)],
    );

  const { pending, success } = await handleTXs(
    [createLPTokenMint, createSwapTokenAAccounts, createSwapTokenBAccounts].map(
      reqsToTXs,
    ),
    "Create initial accounts",
  );
  if (!success) {
    return null;
  }
  await Promise.all(pending.map((p) => p.wait()));

  const result2 = await handleTXs(
    [createInitialLPTokenAccount, seedPoolAccounts].map(reqsToTXs),
    "Seed accounts",
  );
  if (!result2.success) {
    return null;
  }
  await Promise.all(result2.pending.map((p) => p.wait()));

  const initResult = await handleTX(
    reqsToTXs(initializeSwap),
    "Initialize swap",
  );
  if (!initResult.success || !initResult.pending) {
    return null;
  }
  await initResult.pending.wait();

  notify({ message: "Pool created. Check the console for more details." });
  const newSwap = loadSwapFromInitializeArgs(initializeArgs);
  console.log(
    JSON.stringify(
      {
        TokenAMint: tokenAMint.toString(),
        TokenBMint: tokenBMint.toString(),
        SwapAddress: newSwap.config.swapAccount.toString(),
        ProgramID: newSwap.config.swapProgramID.toString(),
        Fees: mapValues(fees, formatPercent),
        AdminAccount: newSwap.state.adminAccount.toString(),
        LPTokenMint: newSwap.state.poolTokenMint.toString(),
        AdminFeeAccountA: newSwap.state.tokenA.adminFeeAccount.toString(),
        AdminFeeAccountB: newSwap.state.tokenB.adminFeeAccount.toString(),
      },
      null,
      2,
    ),
  );

  return newSwap;
}
