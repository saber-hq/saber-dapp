import type { ReactNode } from "react";
import React from "react";

import { InnerContainer } from "../MainLayout/PageContainer";
import { SubSection } from "./SubSection";

interface IProps {
  title?: string;
  children: ReactNode | ReactNode[];
  noPad?: boolean;
  className?: string;
  right?: React.ReactNode;
}

export const SubLayout: React.FC<IProps> = ({
  title,
  children,
  noPad,
  className,
  right,
}: IProps) => {
  return (
    <SubSection title={title} className={className} right={right}>
      <InnerContainer noPad={noPad}>{children}</InnerContainer>
    </SubSection>
  );
};
