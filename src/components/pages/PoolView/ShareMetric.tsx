import React from "react";
import { styled } from "twin.macro";

type IProps = {
  title: string;
  value: React.ReactNode;
  faded?: boolean;
};

export const ShareMetric: React.FC<IProps> = ({
  title,
  value,
  faded,
}: IProps) => {
  return (
    <Wrapper faded={faded}>
      <h3>{title}</h3>
      <span>{value}</span>
    </Wrapper>
  );
};

const Wrapper = styled.div<{
  faded?: boolean;
}>`
  display: flex;
  flex-direction: column;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  h3 {
    color: ${({ theme }) => theme.colors.text.default};
    margin-bottom: 7px;
  }
  & > span {
    color: ${({ theme, faded }) =>
      faded === true ? theme.colors.text.muted : theme.colors.text.bold};
  }
`;
