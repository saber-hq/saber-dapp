import type { Theme } from "@emotion/react";
import React from "react";
import { Link } from "react-router-dom";
import tw, { css, styled } from "twin.macro";

import { breakpoints } from "../../../../theme/breakpoints";
import { Logo } from "../Logo";
import { ConnectedWallet } from "./ConnectedWallet";
import { Navbar } from "./Navbar";

export const TopBar: React.FC = () => {
  return (
    <Wrapper>
      <div tw="flex-grow">
        <Link
          to="/swap"
          css={(theme: Theme) => css`
            display: inline-block;
            color: ${theme.colors.brand.logo};
            :hover {
              color: ${theme.colors.brand.logo};
            }
          `}
        >
          <Logo
            css={css`
              cursor: pointer;
              transition: all 0.3s ease;
              :hover {
                transform: rotate(-8deg);
              }
            `}
          />
        </Link>
      </div>
      <Navbar />
      <Right>
        <ConnectedWallet />
      </Right>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${tw`flex items-center relative`}
  padding: 30px 72px 0;
  margin-bottom: 100px;
  ${breakpoints.medium} {
    padding: 30px 36px 0;
  }
  ${breakpoints.tablet} {
    padding: 10px 16px;
    margin-bottom: 24px;
  }
`;

const Right = styled.div`
  ${tw`fixed z-10 flex-grow flex justify-end items-center md:static`}
`;
