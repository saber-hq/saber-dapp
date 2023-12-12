import { css, Global } from "@emotion/react";
import tw, { GlobalStyles as BaseStyles } from "twin.macro";

import { breakpoints } from "./theme/breakpoints";

export const globalStyles = (
  <>
    <BaseStyles />
    <Global
      styles={(theme) => css`
        [data-reach-dialog-overlay] {
          z-index: 100000;
        }

        body {
          width: calc(100vw - 12px);
          ${breakpoints.mobile} {
            width: 100vw;
          }
        }

        body,
        [data-reach-dialog-overlay] {
          &::-webkit-scrollbar {
            ${tw`w-3`}
          }

          &::-webkit-scrollbar-track {
            background-color: ${theme.colors.base.primary};
          }

          &::-webkit-scrollbar-thumb {
            border-radius: 6px;
            background-color: ${theme.colors.divider.primary};
          }
        }

        body {
          ${tw`font-sans antialiased m-0 overflow-y-scroll`}
          font-size: 13.3333px;
          background: ${theme.colors.base.primary};
          color: ${theme.colors.text.default};
        }

        code {
          font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
            monospace;
        }

        .ant-notification {
          ${breakpoints.mobile} {
            margin-bottom: 56px;
          }
        }

        .dialect {
          ${tw`font-sans`}
        }

        a {
          ${tw`text-blue-500`}
        }
      `}
    />
  </>
);
