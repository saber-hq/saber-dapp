import { FaExternalLinkAlt } from "react-icons/fa";
import { css } from "twin.macro";

import { InfoCard } from "./InfoCard";

interface Props {
  title: string;
  link: string;
  ctaText: string;
}

export const QuarryInfoCard: React.FC<Props> = ({
  title,
  link,
  ctaText,
}: Props) => {
  return (
    <InfoCard color="#DDD605">
      <h2>{title}</h2>
      <p>
        Saber's rewards program is built on Quarry, an audited protocol for
        issuing liquidity mining rewards.
      </p>
      <a
        href={link}
        target="_blank"
        css={css`
          display: inline-flex;
          align-items: center;
          svg {
            margin-left: 4px;
          }
        `}
        rel="noreferrer"
      >
        <span>{ctaText}</span>
        <FaExternalLinkAlt />
      </a>
    </InfoCard>
  );
};
