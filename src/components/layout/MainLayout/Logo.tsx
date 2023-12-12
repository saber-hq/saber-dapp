import React from "react";
import { css, styled } from "twin.macro";

import { breakpoints } from "../../../theme/breakpoints";
import { ReactComponent as Icon } from "../../common/svgs/Icon.svg";
import { ReactComponent as LogoText } from "../../common/svgs/LogoText.svg";

interface IProps {
  className?: string;
}

export const Logo: React.FC<IProps> = ({ className }: IProps) => {
  return (
    <LogoWrapper className={className}>
      <Icon
        css={css`
          color: #6966fb;
          width: 21px;
        `}
      />
      <LogoText
        css={css`
          ${breakpoints.tablet} {
            display: none;
          }
        `}
      />
    </LogoWrapper>
  );
};

const LogoWrapper = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 21px 1fr;
  grid-column-gap: 10px;
`;
