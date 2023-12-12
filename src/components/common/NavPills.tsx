import React from "react";
import { Link, useLocation } from "react-router-dom";
import { styled } from "twin.macro";

import { PageWidthContainer } from "../layout/MainLayout/PageLayout";

interface Props {
  className?: string;
  links: { title: string; href: string; exact?: boolean }[];
  prefix: string;
}

export const NavPills: React.FC<Props> = ({
  prefix,
  className,
  links,
}: Props) => {
  const location = useLocation();

  return (
    <NavbarWrapper className={className}>
      <Navbar>
        {links.map(({ title, href, exact }) => (
          <Link key={href} to={`/${prefix}${href}`}>
            <NavItem
              css={{
                backgroundColor: (
                  exact
                    ? location.pathname === `/${prefix}${href}`
                    : location.pathname.endsWith(`/${prefix}${href}`)
                )
                  ? "#26272b"
                  : undefined,
              }}
            >
              {title}
            </NavItem>
          </Link>
        ))}
      </Navbar>
    </NavbarWrapper>
  );
};

const NavbarWrapper = styled(PageWidthContainer)`
  width: 100%;
  margin: 0px auto;
`;

const Navbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 8px;
`;

const NavItem = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.base.secondary};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.base.tertiary};
    color: ${({ theme }) => theme.colors.text.bold};
  }
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: bold;
`;
