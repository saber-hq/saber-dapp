import React from "react";
import { useParams } from "react-router-dom";

import { useNamedPool } from "../../../utils/exchange/useNamedPool";
import { AllPlotsProvider } from "../../../utils/farming/useAllPlots";
import { ErrorPage } from "../../ErrorPage";
import { MainLayout } from "../../layout/MainLayout";
import { QuarryProvidersWrapper } from "./QuarryProvidersWrapper";

export const QuarryView: React.FC = () => {
  const { poolID = "" } = useParams<{ poolID: string }>();
  const { pool } = useNamedPool(poolID);

  if (!pool) {
    return (
      <MainLayout title="Liquidity Mining" hideOptions>
        <ErrorPage title="Pool not found">
          Pool ID <code>{poolID}</code> not found.
        </ErrorPage>
      </MainLayout>
    );
  }

  return (
    <AllPlotsProvider>
      <QuarryProvidersWrapper poolID={poolID} />
    </AllPlotsProvider>
  );
};

export default QuarryView;
