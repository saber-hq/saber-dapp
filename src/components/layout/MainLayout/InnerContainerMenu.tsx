import type { ReactNode } from "react";
import React from "react";
import { Navigate, NavLink, Route } from "react-router-dom";
import { styled } from "twin.macro";

import { SentryRoutes } from "../../../utils/useAnalytics";
import { AdvancedOptionsButton } from "../../common/AdvancedOptionsButton";

type Item = {
  title: string;
  content: ReactNode;
  path: string;
};

interface IProps {
  root?: string;
  items: readonly Item[];
  hideOptions?: boolean;
}

export const InnerContainerMenu: React.FC<IProps> = ({
  items,
  hideOptions = false,
}: IProps) => {
  return (
    <>
      <Top>
        <Menu>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={`${item.path}`}
              className={({ isActive }) => (isActive ? "is-active" : "")}
            >
              <MenuButton>{item.title}</MenuButton>
            </NavLink>
          ))}
        </Menu>
        {!hideOptions && <AdvancedOptionsButton />}
      </Top>
      <SentryRoutes>
        {items.map(({ path, content }) => (
          <Route key={path} path={path} element={content} />
        ))}
        <Route
          path=""
          element={<Navigate to={`${items[0]?.path ?? ""}`} replace={true} />}
        />
      </SentryRoutes>
    </>
  );
};

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
`;

const Menu = styled.div`
  display: flex;
  align-items: center;
  height: 69px;

  button {
    color: ${({ theme }) => theme.colors.text.default};
  }
  .is-active > button {
    color: ${({ theme }) => theme.colors.text.bold};
  }
`;

const MenuButton = styled.button`
  font-size: 16px;
  margin: 24px 24px 24px 0;
  font-weight: 500;
  cursor: pointer;
  outline: none;

  background: none;
  border: none;
`;
