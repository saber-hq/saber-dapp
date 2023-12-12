import type { ReactNode } from "react";
import React from "react";

import { PageLayout } from "./PageLayout";

interface IProps {
  title?: string;
  sideNav?: React.ReactNode;
  hideOptions?: boolean;
  right?: React.ReactNode;
  children: ReactNode | ReactNode[];
  className?: string;
  maxWidth?: string;
}

export const MainLayout: React.FC<IProps> = ({
  title,
  sideNav,
  children,
  hideOptions,
  right,
  className,
  maxWidth,
}: IProps) => {
  return (
    <>
      {sideNav}
      <PageLayout
        className={className}
        maxWidth={maxWidth}
        title={title}
        hideOptions={hideOptions}
        right={right}
      >
        {children}
      </PageLayout>
    </>
  );
};
