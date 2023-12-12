import React from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import tw, { css, styled, theme } from "twin.macro";

interface Props {
  className?: string;
  children?: React.ReactNode;
  type?: "warning" | "danger" | "info";
}

export const Alert: React.FC<Props> = ({
  className,
  children,
  type = "warning",
}: Props) => {
  const Icon = ICONS[type];
  return (
    <Wrapper className={className} type={type}>
      <Icon
        css={css`
          margin-top: 4px;
        `}
      />
      <Body>{children}</Body>
    </Wrapper>
  );
};

const Body = styled.div``;

const COLORS = {
  warning: "#ffdc00",
  danger: "#ff0033",
  info: theme`colors.blue.500`,
};

const ICONS = {
  warning: FaExclamationTriangle,
  danger: FaExclamationTriangle,
  info: FaInfoCircle,
};

const Wrapper = styled.div<{ type: "warning" | "danger" | "info" }>`
  border-top: 4px solid ${({ type }) => COLORS[type]};
  background: ${({ theme }) => theme.colors.base.tertiary};
  border-radius: 4px;
  color: #fff;
  & > svg {
    color: ${({ type }) => COLORS[type]};
    height: 24px;
    width: 24px;
  }
  ${tw`grid gap-6 p-6`}
  grid-template-columns: 24px 1fr;

  h2 {
    ${tw`text-base leading-normal mb-2 font-semibold`}
  }
`;
