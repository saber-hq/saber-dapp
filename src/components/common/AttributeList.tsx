import React from "react";
import { styled } from "twin.macro";

import { ValueRenderer } from "./ValueRenderer";

interface Props {
  className?: string;
  loading?: boolean;
  attributes: Record<string, unknown>;
}

export const AttributeList: React.FC<Props> = ({
  className,
  loading = true,
  attributes,
}: Props) => {
  return (
    <Wrapper className={className}>
      {Object.entries(attributes).map(([label, attribute]) => (
        <Row key={label}>
          <div>{label}</div>
          <Value>
            <ValueRenderer loading={loading} value={attribute} />
          </Value>
        </Row>
      ))}
    </Wrapper>
  );
};

const Value = styled.div`
  color: ${({ theme }) => theme.colors.text.bold};
  ${({ theme }) => theme.mono};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;
