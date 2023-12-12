import { css } from "twin.macro";

import { SABER_QUARRY_LINK } from "../../../utils/constants";
import type { PlotInfo } from "../../../utils/farming/useAllPlots";
import { CardsContainer } from "../../common/cards/CardsContainer";
import { LoadingPage } from "../../common/LoadingPage";
import { FarmCard } from "./FarmCard";

interface Props {
  myPlots: PlotInfo[];
  loading: boolean;
}

export const MyFarms: React.FC<Props> = ({ myPlots, loading }: Props) => {
  return (
    <div>
      {myPlots.length === 0 &&
        (loading ? (
          <LoadingPage />
        ) : (
          <p
            css={css`
              font-size: 16px;
            `}
          >
            You currently aren't staked into any farms. Please navigate to{" "}
            <a href={SABER_QUARRY_LINK}>Quarry</a> to stake and earn SBR
            rewards.
          </p>
        ))}
      <CardsContainer>
        {myPlots.map((info) => (
          <FarmCard key={info.poolID} info={info} />
        ))}
      </CardsContainer>
    </div>
  );
};
