import { CurrentPlotInfoProvider } from "../../../contexts/plotInfo";
import { usePlotInfo } from "../../../utils/exchange/usePlotInfo";
import { StableSwapProvider } from "../../../utils/useStableSwap";
import { LoadingPage } from "../../common/LoadingPage";
import { PoolIcon } from "../../common/PoolIcon";
import { MainLayout } from "../../layout/MainLayout";
import { QuarryInner } from "./QuarryInner";

interface Props {
  poolID: string;
}

export const QuarryProvidersWrapper: React.FC<Props> = ({ poolID }: Props) => {
  const info = usePlotInfo(poolID);
  return (
    <MainLayout
      title={`${info?.pool.name ?? ""} Liquidity Mining`}
      hideOptions
      right={info ? <PoolIcon tokens={info.pool.underlyingIcons} /> : undefined}
    >
      {info ? (
        <CurrentPlotInfoProvider initialState={info}>
          <StableSwapProvider
            initialState={{
              exchange: info.pool,
            }}
          >
            <QuarryInner />
          </StableSwapProvider>
        </CurrentPlotInfoProvider>
      ) : info === undefined ? (
        <LoadingPage />
      ) : (
        <p>Pool not found</p>
      )}
    </MainLayout>
  );
};
