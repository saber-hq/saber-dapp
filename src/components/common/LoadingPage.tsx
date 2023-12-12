import React from "react";
import { css } from "twin.macro";

import { LoadingSpinner } from "./LoadingSpinner";

interface Props {
  className?: string;
}

export const LoadingPage: React.FC<Props> = ({ className }: Props) => {
  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        justify-content: center;
        height: 50vh;
      `}
      className={className}
    >
      <LoadingSpinner
        css={css`
          height: 84px;
          width: 84px;
        `}
      />
    </div>
  );
};
