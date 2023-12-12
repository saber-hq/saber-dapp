import "@emotion/react";

import * as raw from "./raw";
import { themeJSON } from "./themeJSON";

const { dark: colors, ...themeRest } = themeJSON;

const v2 = raw.darkRaw;
const gen = raw.palette;

const buttonColors = {
  primary: {
    buttontext: {
      muted: gen.mono.dark0,
      disabled: gen.mono.dark3,
      default: v2.button["reverse-text"],
    },
    base: {
      default: gen.brand.base,
      hover: gen.brand.light1,
      pressed: gen.brand.dark0,
      disabled: gen.mono.light2,
    },
  },
  secondary: {
    buttontext: {
      muted: gen.mono.dark0,
      disabled: gen.mono.dark3,
      default: v2.button["reverse-text"],
    },
    base: {
      default: gen.secondary.light3,
      hover: gen.secondary.light1,
      pressed: gen.secondary.base,
      disabled: gen.mono.light2,
    },
  },
};

const functional = { button: buttonColors };

export const theme = {
  mono: `font-family: "Roboto Mono", monospace;`,
  colors,
  v2: raw.darkRaw,
  gen: raw.palette,
  functional,
  ...themeRest,
} as const;

type SSTheme = typeof theme;

declare module "@emotion/react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Theme extends SSTheme {}
}
