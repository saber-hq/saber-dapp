import type { ReactNode } from "react";
import React from "react";
import { styled } from "twin.macro";

interface IProps {
  title?: string;
  children: ReactNode | ReactNode[];
  className?: string;
  right?: React.ReactNode;
}

export const SubSection: React.FC<IProps> = ({
  title,
  children,
  className,
  right,
}: IProps) => {
  return (
    <div className={className}>
      <TitleWrapper>
        {title && <Title>{title} </Title>}
        {right && <div style={{ padding: "2px" }}>{right}</div>}
      </TitleWrapper>
      {children}
    </div>
  );
};

export const TitleWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.default};
  font-size: 18px;
  margin: 0;
  margin-bottom: 24px;
`;
