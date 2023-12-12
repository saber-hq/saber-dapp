import React from "react";

import { MainLayout } from "../../layout/MainLayout";
import { Airdrop } from "./Airdrop";

export const AirdropView: React.FC = () => {
  return (
    <MainLayout title="Airdrops" hideOptions>
      <Airdrop />
    </MainLayout>
  );
};

export default AirdropView;
