import { ErrorBoundary } from "@sentry/react";
import type { ReactNode } from "react";
import React from "react";
import tw, { css, styled } from "twin.macro";

import { AdvancedOptionsButton } from "../../common/AdvancedOptionsButton";

interface IProps {
  title?: string;
  right?: React.ReactNode;
  hideOptions?: boolean;
  children: ReactNode | ReactNode[];
  className?: string;
  maxWidth?: string;
}

export const PageLayout: React.FC<IProps> = ({
  title,
  children,
  hideOptions,
  right,
  className,
  maxWidth,
}: IProps) => {
  return (
    <PageContainer
      className={className}
      css={
        maxWidth
          ? css`
              max-width: ${maxWidth};
            `
          : undefined
      }
    >
      {title && (
        <PageTitleWrapper>
          <PageTitleText>{title}</PageTitleText>
          {hideOptions !== true && <AdvancedOptionsButton />}
          {right}
        </PageTitleWrapper>
      )}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <ErrorBoundary
        fallback={
          <ErrorMessage>
            An error occurred while loading this page.
          </ErrorMessage>
        }
      >
        {children}
      </ErrorBoundary>
    </PageContainer>
  );
};

const ErrorMessage = styled.p`
  color: red;
`;

export const PageWidthContainer = styled.div(
  () => tw`w-11/12 mx-auto md:(w-full max-w-lg)`,
);

export const PageContainer = styled.div`
  ${tw`w-11/12 md:w-full max-w-lg mx-auto grid gap-6 pb-20`}
`;

const PageTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PageTitleText = styled.h1`
  font-weight: 600;
  font-size: 24px;
  line-height: 28.64px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.bold};
`;
