import { QuarryProvider, useRewarder } from "@quarryprotocol/react-quarry";

import { useCurrentPlotInfo } from "../../../contexts/plotInfo";
import { LoadingPage } from "../../common/LoadingPage";
import { ErrorPage } from "../../ErrorPage";
import { QuarryMineInner } from "./QuarryMineInner";

export const QuarryInner: React.FC = () => {
  const {
    pool: { lpToken: stakedToken },
  } = useCurrentPlotInfo();
  const { quarries, rewarder } = useRewarder();
  const quarry = quarries?.find((q) =>
    q.quarry.account.tokenMintKey.equals(stakedToken.mintAccount),
  );

  if (rewarder === undefined || !quarries) {
    return <LoadingPage />;
  }

  if (!quarry) {
    return (
      <ErrorPage title="Invalid Quarry">
        <p>
          The token <code>{stakedToken.address}</code> does not have an
          associated quarry.
        </p>
      </ErrorPage>
    );
  }

  return (
    <QuarryProvider initialState={{ quarry }}>
      <QuarryMineInner />
    </QuarryProvider>
  );
};
