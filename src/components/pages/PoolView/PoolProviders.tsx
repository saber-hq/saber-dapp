import { CurrentPlotInfoProvider } from "../../../contexts/plotInfo";
import { usePlotInfo } from "../../../utils/exchange/usePlotInfo";
import { LoadingPage } from "../../common/LoadingPage";
import { PoolInner } from "./PoolInner";

interface Props {
  poolID: string;
}

export const PoolProviders: React.FC<Props> = ({ poolID }: Props) => {
  const info = usePlotInfo(poolID);

  if (!info) {
    return <LoadingPage />;
  }

  return (
    <CurrentPlotInfoProvider initialState={info}>
      <PoolInner />
    </CurrentPlotInfoProvider>
  );
};
