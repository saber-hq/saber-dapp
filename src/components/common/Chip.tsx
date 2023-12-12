import React from "react";
import { styled } from "twin.macro";

interface Props {
  className?: string;
  label: string;
}

export const Chip: React.FC<Props> = ({ className, label }: Props) => {
  return (
    <ChipWrapper className={className}>
      <LabelText>{label}</LabelText>
    </ChipWrapper>
  );
};

const ChipWrapper = styled.div`
  display: flex;
  justify-content: center;
  max-width: 480px;
  margin: 0px auto;
  background-color: ${({ theme }) => theme.colors.base.tertiary};
  border-radius: 5px;
  width: 100%;
`;

const LabelText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: bold;
  padding: 2px 5px 2px 5px;
`;
