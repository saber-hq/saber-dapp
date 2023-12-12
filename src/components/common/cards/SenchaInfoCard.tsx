import { FaExternalLinkAlt } from "react-icons/fa";
import { css } from "twin.macro";

import { InfoCard } from "./InfoCard";

export const LUNA_SWAP_LINK =
  "https://sencha.so/#/swap/?inputToken=F6v4wfAdJB8D8p77bMXZgYt8TDKsYxLYxH5AFhUkYx9W&outputToken=CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT";

export const ASOL_SWAP_LINK =
  "https://sencha.so/#/swap/?inputToken=ASoLXbfe7cd6igh5yiEsU8M7FW64QRxPKkxk7sjAfond&outputToken=CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT";

export const SenchaInfoCard = ({
  tokenSymbol,
  swapLink,
}: {
  tokenSymbol: string;
  swapLink: string;
}) => {
  return (
    <InfoCard color="#5AC53A">
      <h2>Trade {tokenSymbol} on Sencha </h2>
      <p>
        Sencha is the easiest place to discover and trade new crypto assets on
        Solana.
      </p>

      <a
        href={swapLink}
        target="_blank"
        rel="noreferrer noopener"
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <span>Trade CASH/{tokenSymbol}</span>
        <FaExternalLinkAlt
          css={css`
            margin-left: 4px;
          `}
        />
      </a>
    </InfoCard>
  );
};
