export const darkRaw = {
  brand: "#6966fb",
  bg: {
    primary: "#0a0b0d",
    secondary: "#15181c",
    tertiary: "#212428",
    quaternary: "#25282d",
  },
  text: {
    bold: "#ffffff",
    default: "#868f97",
    muted: "#484f56",
  },
  divider: {
    default: "#28292b",
  },
  input: {
    border: {
      default: "#353536",
    },
    bg: {
      default: "#0a0b0d",
      disabled: "#15181c",
    },
  },
  palette: {
    green: "#4cfb9b",
    red: "#f82161",
  },
  button: {
    "reverse-text": "#000000",
  },
  "active-border-top-green": {
    offset: {},
  },
  "active-border-bottom": {
    offset: {},
  },
  "active-border-top-red": {
    offset: {},
  },
  "card-shadow": "0px 4px 7px rgba(0, 0, 0, 0.25)",
  "button-shadow": "0px 4px 4px rgba(0, 0, 0, 0.25)",
  "border-bottom-table": {
    category: "effect",
    type: "innerShadow",
    radius: 0,
    color: "rgba(40, 41, 43, 1)",
    offset: {
      x: 0,
      y: -1,
    },
    spread: 0,
  },
} as const;

export const lightRaw = {
  brand: "#6966fb",
  bg: {
    primary: "#ffffff",
    secondary: "#15181c",
    tertiary: "#212428",
    quaternary: "#25282d",
  },
  text: {
    bold: "#000000",
    default: "#6f787e",
    muted: "#484f56",
  },
  divider: {
    default: "#28292b",
  },
  input: {
    border: {
      default: "#353536",
    },
    bg: {
      default: "#0a0b0d",
      disabled: "#15181c",
    },
  },
  palette: {
    green: "#4cfb9b",
    red: "#f82161",
  },
  button: {
    "reverse-text": "#000000",
  },
  "active-border-top-green": {
    offset: {},
  },
  "active-border-bottom": {
    offset: {},
  },
  "active-border-top-red": {
    offset: {},
  },
  "card-shadow": "0px 4px 7px rgba(0, 0, 0, 0.25)",
  "button-shadow": "0px 4px 4px rgba(0, 0, 0, 0.25)",
  "border-bottom-table": {
    category: "effect",
    type: "innerShadow",
    radius: 0,
    color: "rgba(40, 41, 43, 1)",
    offset: {
      x: 0,
      y: -1,
    },
    spread: 0,
  },
} as const;

export const palette = {
  mono: {
    dark3: "#191919",
    dark2: "#2e2e2e",
    dark1: "#464646",
    dark0: "#5e5e5e",
    base: "#787878",
    light0: "#939393",
    light1: "#afafaf",
    light2: "#cccccc",
    light3: "#eaeaea",
  },
  brand: {
    dark3: "#000985",
    dark2: "#001ea1",
    dark1: "#1034bf",
    dark0: "#454ddc",
    base: "#6966fb",
    light0: "#8a81ff",
    light1: "#aa9cff",
    light2: "#cab8ff",
    light3: "#ebd5ff",
  },
  secondary: {
    dark3: "#002600",
    dark2: "#003500",
    dark1: "#004e00",
    dark0: "#006917",
    base: "#008431",
    light0: "#00a14a",
    light1: "#00be64",
    light2: "#15dc7f",
    light3: "#4cfb9b",
  },
} as const;

export type ThemeRaw = typeof darkRaw & typeof lightRaw;
