/// <reference types="gtag.js" />
import "twin.macro";

import type { css as cssImport } from "@emotion/react";
import type styledImport from "@emotion/styled";

import type { SSTheme } from "./theme";

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends SSTheme {}
}

declare module "twin.macro" {
  // The styled and css imports
  const styled: typeof styledImport;
  const css: typeof cssImport;
}
