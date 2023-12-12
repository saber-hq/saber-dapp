import { useState } from "react";
import { css, styled } from "twin.macro";

import { LoadingSpinner } from "./LoadingSpinner";

type Props = Omit<
  React.ClassAttributes<HTMLAnchorElement> &
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick"
> & {
  onClick?: () => Promise<void> | void;
};

export const AsyncLink: React.FC<Props> = ({
  onClick,
  children,
  ...linkProps
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <A
      isLoading={loading}
      href="#"
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        // don't allow double click
        if (loading) {
          return;
        }
        setLoading(true);
        await onClick?.();
        setLoading(false);
      }}
      {...linkProps}
    >
      {children}
      {loading && <LoadingSpinner />}
    </A>
  );
};

const A = styled.a<{ isLoading: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  ${({ isLoading, theme }) =>
    isLoading &&
    css`
      color: ${theme.colors.text.muted};
      &:hover {
        color: ${theme.colors.text.muted};
      }
    `}
`;
