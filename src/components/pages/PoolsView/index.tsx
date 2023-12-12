import React from "react";

import { MainLayout } from "../../layout/MainLayout";
import { PoolsInner } from "./PoolsInner";

export const PoolsView: React.FC = () => {
  return (
    <MainLayout hideOptions tw="w-screen max-w-full pb-0">
      <PoolsInner />
    </MainLayout>
  );
};
export default PoolsView;
