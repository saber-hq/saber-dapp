import type { PropsWithChildren } from "react";
import React from "react";
import { styled } from "twin.macro";

import { LoadingSpinner } from "../../common/LoadingSpinner";

type Props = PropsWithChildren<{
  label: string;
}>;

export const LineItem: React.FC<Props> = ({ label, children }: Props) => {
  return (
    <Wrapper>
      <Label>{label}</Label>
      <Content>
        {children ?? <LoadingSpinner key={`LineItem-${label}`} />}
      </Content>
    </Wrapper>
  );
};

const Label = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.default};
`;

const Content = styled.div`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.bold};
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;
