import type { PoolData } from "@saberhq/pool-manager";
import { PoolManagerSDK } from "@saberhq/pool-manager";
import { Saber, WrappedToken } from "@saberhq/saber-periphery";
import type { AssociatedTokenAccount, HandleTXOptions } from "@saberhq/sail";
import type {
  Provider,
  SendTxRequest,
  TransactionReceipt,
} from "@saberhq/solana-contrib";
import { exists, TransactionEnvelope } from "@saberhq/solana-contrib";
import type {
  Fees,
  InitializeNewStableSwapArgs,
} from "@saberhq/stableswap-sdk";
import {
  createInitializeStableSwapInstructions,
  StableSwap,
  SWAP_PROGRAM_ID,
  ZERO_FEES,
} from "@saberhq/stableswap-sdk";
import type { Token } from "@saberhq/token-utils";
import {
  NATIVE_MINT,
  Percent,
  SPLToken,
  TOKEN_PROGRAM_ID,
  TokenAmount,
  u64,
} from "@saberhq/token-utils";
import type { Keypair, PublicKey, Signer } from "@solana/web3.js";
import { mapValues } from "lodash-es";
import invariant from "tiny-invariant";

import { ADMIN_ACCOUNT, POOL_MANAGER_KEY } from "./constants";
import { formatPercent } from "./format";
import { notify } from "./notifications";
import { wrapAndSendSOLToATA } from "./wrappedSol";

/**
 * Very similar to createSwap. Main difference is it uses PoolManager.newStableSwap
 * to create a new stable swap + pool.
 */
export default async function createPool({
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
  signAndConfirmTXs,
}: {
  a: string;
  tokenA: Token;
  tokenB: Token;
  swapAccountSigner: Keypair;
  lpTokenMintSigner: Signer;
  sourceAccountA: AssociatedTokenAccount;
  sourceAccountB: AssociatedTokenAccount;
  provider: Provider;
  saber: Saber;
  tokenAAmount: string;
  tokenBAmount: string;
  signAndConfirmTXs: (
    txEnvs: readonly TransactionEnvelope[],
    msg?: string | undefined,
    options?: HandleTXOptions | undefined,
  ) => Promise<readonly TransactionReceipt[]>;
}): Promise<{
  poolData: PoolData;
  poolKey: PublicKey;
  stableSwap: StableSwap;
} | null> {
  const sdk = PoolManagerSDK.load({ provider });
  const poolManager = await sdk.loadManager(POOL_MANAGER_KEY);

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
    await signAndConfirmTXs([initTX], "Wrapping SOL");
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
    const { wrapped } = wtok;
    invariant(
      wrapped instanceof WrappedToken,
      `wrapped token for ${underlyingAmount.token.symbol} (${decimals} decimals) does not exist`,
    );

    const txEnv = await wtok.wrap(underlyingAmount);
    await signAndConfirmTXs(
      [txEnv],
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
    trade: Percent.fromBPS(4),
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
            initialAmountAU64,
          ),
          SPLToken.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            sourceAccountBKey,
            tokenBAccount,
            owner,
            [],
            initialAmountBU64,
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
  ] = (
    [
      "createLPTokenMint",
      "createSwapTokenAAccounts",
      "createSwapTokenBAccounts",
      "createInitialLPTokenAccount",
      "seedPoolAccounts",
    ] as const
  ).map((method) => {
    const sdk = Saber.load({
      provider,
    });
    const inst = instructions[method];
    const tx = sdk.newTx(inst.instructions.slice());
    if (tx.instructions.length === 0) {
      return null;
    }

    return { tx: tx.build(), signers: inst.signers.slice() };
  }) as [
    SendTxRequest | null,
    SendTxRequest | null,
    SendTxRequest | null,
    SendTxRequest | null,
    SendTxRequest | null,
  ];

  const lpMint = await provider.getAccountInfo(lpTokenMintSigner.publicKey);

  await signAndConfirmTXs(
    [
      !lpMint ? createLPTokenMint : null,
      createSwapTokenAAccounts,
      createSwapTokenBAccounts,
    ]
      .filter(exists)
      .map(
        (t) =>
          new TransactionEnvelope(
            provider,
            t.tx.instructions,
            t.signers.filter(exists),
          ),
      ),
    "Init accounts",
  );
  console.log("p1 success");

  await signAndConfirmTXs(
    [createInitialLPTokenAccount, seedPoolAccounts]
      .filter(exists)
      .map(
        (t) =>
          new TransactionEnvelope(
            provider,
            t.tx.instructions,
            t.signers.filter(exists),
          ),
      ),
    "Seed Pool",
  );
  console.log("p2 success");

  // Main difference from createSwap starts here.

  const { tx: newSwapTx, poolKey } = await poolManager.newStableSwap({
    ampFactor: parsedA,
    swapAccountSigner,
    mintA: tokenAMint,
    reserveA: initializeArgs.tokenA.reserve,
    mintB: tokenBMint,
    reserveB: initializeArgs.tokenB.reserve,
    mintLP: initializeArgs.poolTokenMint,
  });

  await signAndConfirmTXs([newSwapTx], "Create Pool");
  notify({ message: "Pool created. Check the console for more details." });

  const newPool = await poolManager.loadPool(poolKey);
  const newSwap = await StableSwap.load(provider.connection, newPool.swap);

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

  return { poolData: newPool, poolKey, stableSwap: newSwap };
}
