import { useUserATAs } from "@saberhq/sail";
import React from "react";
import { Link } from "react-router-dom";
import tw, { styled } from "twin.macro";

import type { Pool } from "../../../utils/useEnvironment";
import { getSourceName } from "../../../utils/utils";
import { Button } from "../../common/Button";
import { Chip } from "../../common/Chip";
import { PoolIcon } from "../../common/PoolIcon";
import { InnerContainer } from "../../layout/MainLayout/PageContainer";
import { PoolCardBody } from "./PoolCardBody";

interface Props {
  style?: React.CSSProperties;
  className?: string;
  poolID: string;
  pool: Pool;
  showBalance?: boolean;
}

export const PoolCard: React.FC<Props> = ({
  style,
  className,
  poolID,
  pool,
  showBalance = false,
}: Props) => {
  const [balance] = useUserATAs(pool.lpToken);

  const [tokenName1, tokenName2] = pool.name
    .split("-")
    .map((n) => n.split(" ")[0]);

  const [token1, token2] = pool.underlyingIcons;
  const tokenExtension1 = token1?.info?.extensions;
  const tokenExtension2 = token2?.info?.extensions;

  // If both tokens don't have sources, we don't need to show the chips
  const showSource = !!(tokenExtension1?.source ?? tokenExtension2?.source);

  return (
    <InnerContainer style={style} className={className}>
      <InnerWrapper>
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
                  href={tokenExtension2?.sourceUrl?.toString()}
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
        <PoolCardBody pool={pool} showBalance={showBalance} />
        <CenterLayout>
          <ButtonContainer>
            <Link to={`/pools/${poolID}/deposit`}>
              <Button size="medium">
                {balance?.balance.greaterThan("0") ? "Manage" : "Deposit"}
              </Button>
            </Link>
          </ButtonContainer>
        </CenterLayout>
      </InnerWrapper>
    </InnerContainer>
  );
};

const InnerWrapper = styled.div`
  display: grid;
  gap: 16px;
`;

const SplitContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const AllTokenContainer = styled.div`
  ${tw`flex items-center flex-wrap gap-y-2 gap-x-6 md:gap-x-8`}
`;

const TokenContainer = styled.div`
  ${tw`grid`}
`;

const TokenSymbol = styled.div`
  color: ${({ theme }) => theme.colors.text.bold};
  ${tw`font-bold text-lg md:text-2xl`}
`;

const ButtonContainer = styled.div`
  width: 100%;
`;

const CenterLayout = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const ChipContainer = styled.div`
  cursor: pointer;
  min-height: 30px;
`;
