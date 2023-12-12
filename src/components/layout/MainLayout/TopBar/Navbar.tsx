import type { Theme } from "@emotion/react";
import { useConnectionContext } from "@saberhq/use-solana";
import React, { useMemo, useState } from "react";
import {
  FaBook,
  FaCaretDown,
  FaChartBar,
  FaComment,
  FaMedium,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import tw, { css, styled } from "twin.macro";

import { theme } from "../../../../theme";
import { breakpoints } from "../../../../theme/breakpoints";
import { COINGECKO_LINK } from "../../../../utils/constants";
import { ReactComponent as CoinGeckoIcon } from "./icons/CoinGecko.svg";
import { ReactComponent as DiscordIcon } from "./icons/Discord.svg";
import { ReactComponent as GitHubIcon } from "./icons/GitHub.svg";
import { ReactComponent as TwitterIcon } from "./icons/Twitter.svg";
import { MenuDropdown } from "./MenuDropdown";

const Menu = styled.div`
  ${tw`flex sm:gap-0.5 md:gap-1.5 lg:gap-3`}
`;

const commonItemStyles = (theme: Theme) => css`
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.1s ease;

  color: ${theme.colors.text.default};

  &.is-active,
  &:hover {
    color: ${theme.colors.text.bold};
    background-color: ${theme.colors.tabs.base.active};
  }

  ${breakpoints.mobile} {
    padding: 9.74px;
    font-size: 12.9871px;
    line-height: 15px;
  }
`;

const MenuDropdownItemRelative = styled.div`
  position: relative;
`;

const MenuDropdownItem = styled.div`
  ${({ theme }) => commonItemStyles(theme)};

  cursor: pointer;
  display: flex;
  align-items: center;
  & > span {
    margin-right: 10px;
  }
  user-select: none;
`;

const MenuLink = styled.a`
  ${({ theme }) => commonItemStyles(theme)};
`;

const LINKS = {
  "/swap": {
    title: "Swap",
  },
  "/pools": {
    title: "Pools",
  },
  "/farms": {
    title: "Farms",
  },
  "/vote": {
    title: "Vote",
  },
  "/airdrop": {
    title: "Airdrops",
    testnetOnly: true,
  },
  "/more": {
    title: "More",
    children: {
      "https://docs.saber.so": {
        title: "Docs",
        Icon: FaBook,
      },
      "https://chat.saber.so": {
        title: "Discord",
        Icon: DiscordIcon,
      },
      "https://saber.markets": {
        title: "Stats",
        Icon: FaChartBar,
      },
      "https://twitter.com/Saber_HQ": {
        title: "Twitter",
        Icon: TwitterIcon,
      },
      "https://github.com/saber-hq/stable-swap": {
        title: "GitHub",
        Icon: GitHubIcon,
      },
      "https://blog.saber.so/": {
        title: "Medium",
        Icon: FaMedium,
      },
      "https://github.com/saber-hq/governance/discussions": {
        title: "Forum",
        Icon: FaComment,
      },
      [COINGECKO_LINK]: {
        title: "CoinGecko",
        Icon: CoinGeckoIcon,
      },
    },
  },
} as const;

export const Navbar: React.FC = () => {
  const { network } = useConnectionContext();
  const links: readonly [
    string,
    {
      title: string;
      href?: string;
      children?: Record<
        string,
        {
          title: string;
          Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
        }
      >;
    },
  ][] = useMemo(
    () =>
      Object.entries(LINKS).filter(
        (
          el: [
            string,
            { title: string; devOnly?: boolean; testnetOnly?: boolean },
          ],
        ) => (network === "mainnet-beta" ? el[1].testnetOnly !== true : true),
      ),
    [network],
  );

  const [expandedHref, setExpandedHref] = useState<string | null>(null);

  return (
    <>
      {expandedHref !== null && (
        <ClickOutOverlay onClick={() => setExpandedHref(null)} />
      )}
      <Menu>
        {links.map(([prefix, { title, children, href = prefix }]) => {
          if (href === "/vote") {
            return (
              <MenuLink
                key={href}
                target={"_blank"}
                href={`https://${
                  network === "devnet" ? "devnet." : ""
                }tribeca.so/gov/sbr/`}
              >
                {title}
              </MenuLink>
            );
          }
          return children !== undefined ? (
            <MenuDropdownItemRelative key={href}>
              <MenuDropdownItem
                onClick={() =>
                  setExpandedHref(expandedHref === href ? null : href)
                }
              >
                <span>{title}</span>
                <FaCaretDown />
              </MenuDropdownItem>
              {href === expandedHref && (
                <MenuDropdown
                  css={css`
                    position: absolute;
                    left: 0;
                    top: 51px;
                    z-index: 2;
                    ${breakpoints.mobile} {
                      left: auto;
                      right: 0;
                    }
                  `}
                  items={Object.entries(children).map(
                    ([href, { title, Icon }]) => ({ title, href, Icon }),
                  )}
                />
              )}
            </MenuDropdownItemRelative>
          ) : (
            <NavLink
              to={href}
              key={href}
              css={(theme) => css`
                ${commonItemStyles(theme)}
              `}
              style={({ isActive }) =>
                isActive
                  ? {
                      color: theme.colors.text.bold,
                      backgroundColor: theme.colors.tabs.base.active,
                    }
                  : {}
              }
            >
              {title}
            </NavLink>
          );
        })}
      </Menu>
    </>
  );
};

const ClickOutOverlay = styled.div`
  position: fixed;
  width: 100vw;
  height: calc(100vh - 100px);
  top: 100px;
  z-index: 1;
`;
