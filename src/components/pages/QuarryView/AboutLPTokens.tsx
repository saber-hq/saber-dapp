import { FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { css } from "twin.macro";

import { useCurrentPlotInfo } from "../../../contexts/plotInfo";
import { useStableSwap } from "../../../utils/useStableSwap";
import { InfoCard } from "../../common/cards/InfoCard";

export const AboutLPTokens: React.FC = () => {
  const { pool, poolID } = useCurrentPlotInfo();
  const { exchange } = useStableSwap();
  if (!exchange) {
    return null;
  }
  return (
    <InfoCard
      css={css`
        margin-bottom: 24px;
      `}
    >
      <h2>About Saber LP Tokens</h2>
      <p>
        LP tokens are tokens which represent a share of the liquidity provided
        to a Saber staking pool.
      </p>
      <p>
        You may obtain LP tokens by depositing {exchange.tokens[0].name} (
        {exchange.tokens[0].symbol}) or {exchange.tokens[1].name} (
        {exchange.tokens[1].symbol}) into the {pool.name} pool.
      </p>
      <Link to={`/pools/${poolID}/deposit`}>
        <span>Deposit into the {pool.name} Pool</span>
        <FaExternalLinkAlt />
      </Link>
    </InfoCard>
  );
};
