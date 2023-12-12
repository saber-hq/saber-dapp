import { QuarryProvider } from "@quarryprotocol/react-quarry";
import { BN } from "bn.js";
import React from "react";
import { Link } from "react-router-dom";
import { styled } from "twin.macro";

import type { PlotInfo } from "../../../utils/farming/useAllPlots";
import { StableSwapProvider } from "../../../utils/useStableSwap";
import { getSourceName } from "../../../utils/utils";
import { Button } from "../../common/Button";
import { Chip } from "../../common/Chip";
import { PoolIcon } from "../../common/PoolIcon";
import { InnerContainer } from "../../layout/MainLayout/PageContainer";
import { FarmCardBodyLoader } from "./FarmCardBodyLoader";
import { FarmCardMinerBody } from "./FarmCardMinerBody";
import { FarmCardQuarryBody } from "./FarmCardQuarryBody";

interface Props {
  className?: string;
  info: PlotInfo;
}

export const FarmCard: React.FC<Props> = ({ className, info }: Props) => {
  const { poolID, pool, quarry, minerData: miner } = info;

  const [tokenName1, tokenName2] = pool.name.split("-");

  const [token1, token2] = pool.underlyingIcons;

  const tokenExtension1 = token1?.info?.extensions;
  const tokenExtension2 = token2?.info?.extensions;

  // If both tokens don't have sources, we don't need to show the chips
  const showSource = tokenExtension1?.source || tokenExtension2?.source;

  return (
    <InnerContainer>
      <Wrapper className={className}>
        <SplitContainer>
          <AllTokenContainer>
            <TokenContainer>
              {showSource && (
                <a
                  href={tokenExtension1?.sourceUrl?.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChipContainer>
                    {tokenExtension1?.source && (
                      <Chip label={getSourceName(tokenExtension1?.source)} />
                    )}
                  </ChipContainer>
                </a>
              )}
              <TokenSymbol>{tokenName1}</TokenSymbol>
            </TokenContainer>
            <TokenContainer>
              {showSource && (
                <a
                  href={tokenExtension2?.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChipContainer>
                    {tokenExtension2?.source && (
                      <Chip label={getSourceName(tokenExtension2?.source)} />
                    )}
                  </ChipContainer>
                </a>
              )}

              <TokenSymbol>{tokenName2}</TokenSymbol>
            </TokenContainer>
          </AllTokenContainer>
          <PoolIcon tokens={pool.underlyingIcons} size={40} />
        </SplitContainer>
        <CardBody>
          <StableSwapProvider initialState={{ exchange: pool }}>
            {quarry !== null &&
              (quarry ? (
                <QuarryProvider initialState={{ quarry }}>
                  <FarmCardQuarryBody />
                </QuarryProvider>
              ) : (
                <FarmCardBodyLoader />
              ))}
            {quarry && miner && (
              <QuarryProvider initialState={{ quarry }}>
                <FarmCardMinerBody info={info} miner={miner} />
              </QuarryProvider>
            )}
          </StableSwapProvider>
        </CardBody>
        <CenterLayout>
          <ButtonContainer>
            <Link to={`/quarries/${poolID}/stake`}>
              <Button size="medium">
                {miner?.account.balance.gt(new BN(0)) ? "Manage" : "Stake"}
              </Button>
            </Link>
          </ButtonContainer>
        </CenterLayout>
      </Wrapper>
    </InnerContainer>
  );
};

const SplitContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const AllTokenContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 30px;
  row-gap: 8px;
`;
const TokenContainer = styled.div`
  display: grid;
`;

const TokenSymbol = styled.div`
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: bold;
  font-size: 22px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const CardBody = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-direction: column;
  font-size: 16px;
`;

const CenterLayout = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const ButtonContainer = styled.div`
  width: 100%;
`;

const ChipContainer = styled.div`
  cursor: pointer;
  min-height: 30px;
  width: 100%;
`;
