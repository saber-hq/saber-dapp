import React from "react";

import { MainLayout } from "../../layout/MainLayout";
import { PoolCreateViewInner } from "./PoolCreateViewInner";

export const PoolCreateView: React.FC = () => {
  return (
    <MainLayout title="Create a Pool (beta)" hideOptions>
      <PoolCreateViewInner />
    </MainLayout>
  );
};
