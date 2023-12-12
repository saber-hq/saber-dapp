import React from "react";
import { useParams } from "react-router-dom";

import { CURRENCY_INFO } from "../../../utils/currencies";
import { useNamedPool } from "../../../utils/exchange/useNamedPool";
import { AllPlotsProvider } from "../../../utils/farming/useAllPlots";
import { StableSwapProvider } from "../../../utils/useStableSwap";
import { LoadingPage } from "../../common/LoadingPage";
import { PoolIcon } from "../../common/PoolIcon";
import { MainLayout } from "../../layout/MainLayout";
import { SubLayout } from "../../layout/SubLayout";
import { PoolProviders } from "./PoolProviders";

export const PoolView: React.FC = () => {
  const { poolID = "" } = useParams<"poolID">();
  const { pool, loading } = useNamedPool(poolID);

  if (!pool) {
    return (
      <MainLayout title={`Unknown Pool ${poolID}`}>
        <SubLayout title="Unknown Pool">
          <p>
            The pool <code>{poolID}</code> does not exist.
          </p>
        </SubLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${pool.name} ${CURRENCY_INFO[pool.currency].name} Pool`}
      hideOptions
      right={pool ? <PoolIcon tokens={pool.underlyingIcons} /> : undefined}
    >
      {loading ? (
        <LoadingPage />
      ) : (
        <StableSwapProvider
          initialState={{
            exchange: pool,
          }}
        >
          <AllPlotsProvider>
            <PoolProviders key={poolID} poolID={poolID} />
          </AllPlotsProvider>
        </StableSwapProvider>
      )}
    </MainLayout>
  );
};

export default PoolView;
