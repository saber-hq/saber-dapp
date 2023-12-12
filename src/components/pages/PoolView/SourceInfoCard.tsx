import { exists } from "@saberhq/solana-contrib";
import { css } from "twin.macro";

import type { SourceInfo } from "../../../utils/metadata/sources";
import { SubLayout } from "../../layout/SubLayout";

interface Props {
  source: SourceInfo;
  className?: string;
}

export const SourceInfoCard = ({ source, className }: Props) => {
  return (
    <SubLayout
      title={`About ${source.name}`}
      css={css`
        margin-top: 48px;
      `}
      className={className}
    >
      <div tw="flex gap-4 items-center">
        <div tw="flex-1">
          {source.description
            .split("\n")
            .filter(exists)
            .map((line, i) => {
              return <p key={`${source.name}_${i}`}>{line}</p>;
            })}
        </div>
        <div>
          <img
            src={source.iconURL}
            tw="w-16 h-16"
            alt={`Icon for ${source.name}`}
          />
        </div>
      </div>
      <div tw="my-2">
        <span tw="text-white">Audit Status:&nbsp;</span>
        {source.auditors.length > 0 ? (
          <span tw="text-green-500">
            Audited by {source.auditors.join(", ")}
          </span>
        ) : (
          <span tw="text-red-500">Unaudited</span>
        )}
      </div>
      <div tw="flex gap-2 mt-4">
        <a
          href={source.website}
          target="_blank"
          rel="noreferrer"
          tw="px-5 py-1 rounded bg-saberGray-tertiary text-white hover:bg-gray-600 transition-colors"
        >
          Website
        </a>
        <a
          href={source.risksURL}
          target="_blank"
          rel="noreferrer"
          tw="px-5 py-1 rounded bg-saberGray-tertiary text-white hover:bg-gray-600"
        >
          Risks
        </a>
        {source.sourceURL ? (
          "Yes"
        ) : (
          <a
            href={source.sourceURL}
            target="_blank"
            rel="noreferrer"
            tw="px-5 py-1 rounded bg-saberGray-tertiary text-white hover:bg-gray-600"
          >
            Closed Source
          </a>
        )}
      </div>
    </SubLayout>
  );
};
