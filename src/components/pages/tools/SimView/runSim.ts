import type { AnyPair } from "@saberhq/saber-periphery";
import { Pair, Route, Trade } from "@saberhq/saber-periphery";
import type {
  StableSwapConfig,
  StableSwapState,
} from "@saberhq/stableswap-sdk";
import { Percent, TokenAmount } from "@saberhq/token-utils";
import { NATIVE_MINT } from "@solana/spl-token";
import JSBI from "jsbi";
import { keyBy, mapValues } from "lodash-es";

const makeRoute = (
  a: JSBI,
  reserve0: TokenAmount,
  reserve1: TokenAmount,
): Route => {
  const exchange = {
    ampFactor: JSBI.BigInt(a),
    fees: {
      trade: new Percent(0),
      withdraw: new Percent(0),
      adminTrade: new Percent(0),
      adminWithdraw: new Percent(0),
    },
    // assume virtual price of token is 1
    lpTotalSupply: new TokenAmount(
      reserve0.token,
      JSBI.add(reserve0.raw, reserve1.raw),
    ),
    reserves: [
      {
        amount: reserve0,
        reserveAccount: NATIVE_MINT,
        adminFeeAccount: NATIVE_MINT,
      },
      {
        amount: reserve1,
        reserveAccount: NATIVE_MINT,
        adminFeeAccount: NATIVE_MINT,
      },
    ],
  } as const;
  const config = null as unknown as StableSwapConfig;
  const state = null as unknown as StableSwapState;
  const pair = Pair.fromStableSwap({
    config,
    state,
    exchange,
  });
  return new Route([pair as AnyPair], reserve0.token, reserve1.token);
};

const runSimSingle = (route: Route, fromAmount: number): Trade | null => {
  const fromTokAmount = TokenAmount.parse(route.input, fromAmount.toString());
  try {
    return new Trade(route, fromTokAmount);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("insufficient input amount")) {
        return null;
      }
    }
    console.warn(e);
    return null;
  }
};

export const runSim = (
  a: JSBI,
  reserve0: TokenAmount,
  reserve1: TokenAmount,
): {
  [input: number]: Trade | null;
} => {
  const inputs = [
    0.01, 0.1, 0.5, 1, 5, 10, 50, 100, 500, 1_000, 2_000, 5_000, 10_000, 20_000,
    50_000, 100_000, 1_000_000, 10_000_000,
  ];
  const route = makeRoute(a, reserve0, reserve1);

  return mapValues(
    keyBy(inputs, (e) => e),
    (input) => runSimSingle(route, input),
  );
};
