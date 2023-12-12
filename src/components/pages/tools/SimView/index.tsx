import type { Trade } from "@saberhq/saber-periphery";
import {
  useParsedAccount,
  useTokenAccount,
  useTokenAmount,
} from "@saberhq/sail";
import { mapSome } from "@saberhq/solana-contrib";
import { calculateAmpFactor } from "@saberhq/stableswap-sdk";
import { ENV, Token, TokenAmount } from "@saberhq/token-utils";
import JSBI from "jsbi";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { styled } from "twin.macro";

import { swapParser } from "../../../../utils/exchange/useAllPools";
import { useNamedPool } from "../../../../utils/exchange/useNamedPool";
import { Button } from "../../../common/Button";
import { BigNumericInput } from "../../../common/inputs/BigNumericInput";
import { Slippage } from "../../../common/Slippage";
import { MainLayout } from "../../../layout/MainLayout";
import { InnerContainer } from "../../../layout/MainLayout/PageContainer";
import { runSim } from "./runSim";

const USDC_MAINNET: Token = new Token({
  address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  chainId: ENV.MainnetBeta,
  logoURI: "https://registry.saber.so/token-icons/usdc.svg",
});

const USDT_MAINNET: Token = new Token({
  chainId: ENV.MainnetBeta,
  address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  symbol: "USDT",
  name: "USDT",
  decimals: 6,
  logoURI: "https://registry.saber.so/token-icons/usdt.svg",
});

export const SimView: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const poolID = params.get("pool");
  const pool = useNamedPool(poolID ?? "");

  const { data: swap } = useParsedAccount(
    pool.pool?.swap.config.swapAccount,
    swapParser,
  );
  const { data: reserveAAccount } = useTokenAccount(
    pool.pool?.swap.state.tokenA.reserve,
  );
  const { data: reserveBAccount } = useTokenAccount(
    pool.pool?.swap.state.tokenB.reserve,
  );

  const tokenA = pool.pool?.tokens[0] ?? USDC_MAINNET;
  const tokenB = pool.pool?.tokens[1] ?? USDT_MAINNET;

  const reserveA = mapSome(
    reserveAAccount,
    (r) => new TokenAmount(tokenA, r.account.amount),
  );
  const reserveB = mapSome(
    reserveBAccount,
    (r) => new TokenAmount(tokenB, r.account.amount),
  );

  const [a, setA] = useState<string>(params.get("a") ?? "1");
  const [reserve0Raw, setReserve0Raw] = useState<string>(
    params.get("reserve0") ?? "100000",
  );
  const [reserve1Raw, setReserve1Raw] = useState<string>(
    params.get("reserve1") ?? "100000",
  );

  const reserve0 = useTokenAmount(tokenA, reserve0Raw);
  const reserve1 = useTokenAmount(tokenB, reserve1Raw);

  const [output, setOutput] = useState<{
    [input: number]: Trade | null;
  } | null>(null);
  useEffect(() => {
    if (!reserve0 || !reserve1) {
      return;
    }
    try {
      const result = runSim(JSBI.BigInt(a), reserve0, reserve1);
      setOutput(result);
    } catch (e) {
      console.warn("Error parsing", e);
    }
  }, [a, reserve0, reserve1, tokenA, tokenB]);

  return (
    <>
      <MainLayout title="Simulate">
        <h2>Simulation Parameters</h2>
        <p>
          Enter various parameters here to see a simulation of what the slippage
          etc. will look like.
        </p>
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
            <span>Input Token Liquidity</span>
            <BigNumericInput
              placeholder="0.00"
              value={reserve0Raw}
              onChange={(v) => setReserve0Raw(v)}
            />
          </LabelWrapper>
          <LabelWrapper>
            <span>Output Token Liquidity</span>
            <BigNumericInput
              placeholder="0.00"
              value={reserve1Raw}
              onChange={(v) => setReserve1Raw(v)}
            />
          </LabelWrapper>
          <div tw="flex gap-4 mt-4">
            {pool && (
              <Button
                size="small"
                onClick={() => {
                  if (swap) {
                    setA(calculateAmpFactor(swap.account).toString());
                  }
                  if (reserveA) {
                    setReserve0Raw(reserveA.toExact());
                  }
                  if (reserveB) {
                    setReserve1Raw(reserveB.toExact());
                  }
                }}
              >
                Sync with pool
              </Button>
            )}
            <Button
              size="small"
              onClick={() => {
                setReserve0Raw(reserve1Raw);
                setReserve1Raw(reserve0Raw);
              }}
            >
              Swap Input and Output
            </Button>
          </div>
        </InnerContainer>
      </MainLayout>
      <ResultContainer>
        <h2>Result</h2>
        <InnerContainer>
          {output ? (
            <table>
              <thead>
                <tr>
                  <th>Input Amount</th>
                  <th>Output Amount</th>
                  <th>Price w/o Slippage</th>
                  <th>Actual Price</th>
                  <th>Price Impact</th>
                  <th>Price after trade</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(output)
                  .sort((a, b) => {
                    const a1 = a[1];
                    const b1 = b[1];
                    if (a1 && b1) {
                      return a1.inputAmount.greaterThan(b1.inputAmount)
                        ? 1
                        : -1;
                    }
                    if (a1 && !b1) {
                      return -1;
                    } else if (!a1 && b1) {
                      return 1;
                    }
                    return 0;
                  })
                  .map(([input, trade], i) => (
                    <tr key={i}>
                      <td>
                        {trade?.inputAmount.toExact({
                          groupSeparator: ",",
                        }) ?? input}
                      </td>
                      {trade ? (
                        <>
                          <td>
                            {trade.outputAmount.toExact({
                              groupSeparator: ",",
                            })}
                          </td>
                          <td>{trade.route.midPrice.toFixed(4)}</td>
                          <td>{trade.executionPrice.toFixed(4)}</td>
                          <td>
                            <Slippage value={trade.priceImpact} />
                          </td>
                          <td>{trade.nextMidPrice.toFixed(4)}</td>
                        </>
                      ) : (
                        <>
                          <td>0</td>
                          <td>n/a</td>
                          <td>n/a</td>
                          <td>n/a</td>
                          <td>n/a</td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p>Please enter some parameters.</p>
          )}
        </InnerContainer>
      </ResultContainer>
    </>
  );
};

const ResultContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0px auto;
  table {
    width: 100%;
  }
  td {
    padding: 4px;
  }
  tr:nth-child(even) {
    background-color: ${({ theme }) => theme.colors.base.tertiary};
  }
`;

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

export default SimView;
