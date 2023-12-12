import React from "react";

import { Alert } from "../../common/Alert";
import { MainLayout } from "../../layout/MainLayout";
import { ExchangeSwap } from "./ExchangeSwap";

export const SwapView: React.FC = () => {
  return (
    <MainLayout title="Swap">
      <Alert type="info">
        <p tw="mb-2">
          Saber has recently migrated to new infrastructure. If you encounter
          any issues, use the old application at{" "}
          <a href="https://legacy.saber.so" target="_blank" rel="noreferrer">
            legacy.saber.so
          </a>
          .
        </p>
        <p>
          Please report any bugs to our{" "}
          <a href="https://chat.saber.so" target="_blank" rel="noreferrer">
            Discord
          </a>
          .
        </p>
      </Alert>
      <ExchangeSwap />
    </MainLayout>
  );
};

export default SwapView;
