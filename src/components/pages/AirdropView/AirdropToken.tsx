import type { Token } from "@saberhq/token-utils";
import { TokenAmount } from "@saberhq/token-utils";
import React from "react";
import { styled } from "twin.macro";

import { breakpoints } from "../../../theme/breakpoints";
import { AsyncButton } from "../../common/AsyncButton";
import { TokenAmountDisplay } from "../../common/TokenAmountDisplay";
import { TokenDropdown } from "../../common/TokenDropdown";

interface IProps {
  token: Token;
  tokenBalance?: TokenAmount | null;
  onClaim: () => void | Promise<void>;
}

export const AirdropToken: React.FC<IProps> = ({
  token,
  tokenBalance,
  onClaim,
}: IProps) => {
  return (
    <TokenBox>
      <Left>
        <Section>
          <TokenDropdown tokens={[]} token={token} />
        </Section>
        <Section>
          <Balance>
            Wallet Balance:{" "}
            <Accent>
              {tokenBalance === undefined ? (
                "--"
              ) : (
                <TokenAmountDisplay
                  amount={tokenBalance ?? new TokenAmount(token, 0)}
                />
              )}
            </Accent>
          </Balance>
        </Section>
      </Left>
      <AsyncButton onClick={onClaim} size="small">
        Claim
      </AsyncButton>
    </TokenBox>
  );
};

const Left = styled.div`
  display: grid;
  grid-row-gap: 24px;
  grid-auto-flow: row;
`;

const Accent = styled.span`
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.text.accent};
  ${({ theme }) => theme.mono};
`;

const Balance = styled.div`
  font-weight: normal;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.default};
  display: flex;
`;

const Section = styled.div`
  width: fit-content;
`;

const TokenBox = styled.div`
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  }
  ${breakpoints.mobile} {
    flex-direction: column;
    ${Left} {
      align-items: center;
      & > div {
        justify-self: center;
      }
      margin-bottom: 12px;
    }
  }
`;
