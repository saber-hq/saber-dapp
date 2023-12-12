import type { ReactNode } from "react";
import React from "react";
import { css } from "twin.macro";

import { AllPlotsProvider } from "../../../utils/farming/useAllPlots";
import { NavPills } from "../../common/NavPills";
import { MainLayout } from "../MainLayout";

interface Props {
  title: string;
  hideOptions?: boolean;
  children: ReactNode | ReactNode[];
}

const ITEMS = [
  {
    title: "Mint Proxy",
    href: "/mint-proxy",
  },
  {
    title: "Pools",
    href: "/pools",
  },
  {
    title: "Lockups",
    href: "/lockups",
  },
  {
    title: "Redeemer",
    href: "/redeemer",
  },
  {
    title: "Create Wrapper",
    href: "/wrappers/create",
  },
  {
    title: "Create Pool",
    href: "/pools/create",
  },
];

export const AdminLayout: React.FC<Props> = ({ children, ...props }: Props) => {
  return (
    <MainLayout
      {...props}
      sideNav={
        <NavPills
          prefix="admin"
          links={ITEMS}
          css={css`
            margin: -24px auto 48px;
          `}
        />
      }
      hideOptions
    >
      <AllPlotsProvider>{children}</AllPlotsProvider>
    </MainLayout>
  );
};
