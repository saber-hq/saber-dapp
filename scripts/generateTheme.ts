import fs from "fs/promises";
import { mapValues } from "lodash-es";
import { parseToRgb, toColorString } from "polished";
import type { CSSProperties } from "react";

import designTokens from "./fixtures/design-tokens.json";

interface IColor {
  category?: "fill";
  value: string;
  type: "color";
}

interface IGradient {
  category: "fill";
  gradientType: {
    value: string;
    type: string;
  };
  stops: {
    [key: string]: {
      position: {
        value: number;
        type: "number";
      };
      color: IColor;
    };
  };
  opacity: {
    value: number;
    type: "number";
  };
}

interface INumberValue {
  value: number;
  type: "number";
  unit?: "pixel" | "percent";
}

const renderNumber = (v: INumberValue) => {
  return v.unit === "pixel"
    ? `${v.value}px`
    : v.unit === "percent"
      ? `${v.value}%`
      : `${v.value}`;
};

interface IStringValue {
  value: string;
  type: "string";
  unit?: "auto";
}

interface IFont {
  category: "font";
  fontSize: INumberValue;
  textDecoration: IStringValue;
  fontFamily: IStringValue;
  fontWeight: INumberValue;
  fontStyle: IStringValue;
  fontStretch: IStringValue;
  lineHeight: IStringValue;
  paragraphIndent: INumberValue;
  paragraphSpacing: INumberValue;
  textCase: IStringValue;
  letterSpacing: INumberValue;
}

interface IDropShadow {
  category: "effect";
  type: {
    value: "dropShadow";
    type: "string";
  };
  radius: INumberValue;
  color: IColor;
  offset: {
    x: INumberValue;
    y: INumberValue;
  };
  spread: INumberValue;
}

const parseColor = (color: IColor): string => {
  return toColorString(parseToRgb(color.value));
};

const parseGradient = (gradient: IGradient): string => {
  return `linear-gradient(0deg, ${Object.values(gradient.stops)
    .map((stop) => `${parseColor(stop.color)} ${stop.position.value * 100}%`)
    .join(", ")})`;
};

const parseFont = (font: IFont): CSSProperties => {
  return {
    fontWeight: font.fontWeight.value,
    fontSize: renderNumber(font.fontSize),
    textDecoration: font.textDecoration.value,
    fontStyle: font.fontStyle.value,
    fontStretch: font.fontStretch.value,
    letterSpacing: renderNumber(font.letterSpacing),
    textIndent: renderNumber(font.paragraphIndent),
  };
};

const parseDropShadow = (shadow: IDropShadow): string => {
  return `${shadow.offset.x.value}px ${shadow.offset.y.value}px ${
    shadow.radius.value
  }px ${parseColor(shadow.color)}`;
};

const generateTheme = (
  kv: Record<string, unknown>,
): Record<string, unknown> | string | CSSProperties => {
  if (kv.category === "fill") {
    if (kv.type === "color") {
      return parseColor(kv as unknown as IColor);
    }
    if ("stops" in kv) {
      return parseGradient(kv as unknown as IGradient);
    }
  }
  if (kv.category === "font") {
    return parseFont(kv as unknown as IFont);
  }
  if (
    kv.category === "effect" &&
    (kv.type as { value?: string })?.value === "dropShadow"
  ) {
    return parseDropShadow(kv as unknown as IDropShadow);
  }
  return mapValues(kv, (v) => {
    if (typeof v === "object") {
      return generateTheme(v as Record<string, unknown>);
    }
    return null;
  }) as Record<string, unknown>;
};

export const main = async (): Promise<void> => {
  const theme = generateTheme(designTokens);
  await fs.writeFile(
    `${__dirname}/../src/theme/themeJSON.ts`,
    `export const themeJSON = ${JSON.stringify(theme)} as const;`,
  );
};

main().catch((err) => console.error(err));
