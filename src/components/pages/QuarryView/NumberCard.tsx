import React from "react";
import { css, styled, theme } from "twin.macro";

interface Props {
  className?: string;
  title: string;
  amount: React.ReactNode;
  descriptor: React.ReactNode;
  action?: React.ReactNode;
}

export const NumberCard: React.FC<Props> = ({
  className,
  title,
  amount,
  descriptor,
  action,
}: Props) => {
  return (
    <Wrapper className={className}>
      <WestSide>
        <Title>{title}</Title>
        <Amount>{amount}</Amount>
      </WestSide>
      <WestSide
        css={css`
          align-items: flex-end;
        `}
      >
        {action ?? <div />}
        <Descriptor>{descriptor}</Descriptor>
      </WestSide>
    </Wrapper>
  );
};

const Wrapper = styled.div(
  () => css`
    height: 105px;
    border-radius: 12px;
    padding: 16px 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: radial-gradient(
      100% 100% at 10% 25%,
      rgb(72, 69, 182) 0%,
      ${theme`colors.saberGray.tertiary`} 100%
    );
  `,
);

const Title = styled.span`
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 12px;
`;

const Amount = styled.span`
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: 600;
  font-size: 28px;
  line-height: 1;

  ${({ theme }) => theme.mono};
`;

const WestSide = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Descriptor = styled.div`
  line-height: 1;
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: 500;
  font-size: 16px;
`;
