import chroma from "chroma-js";
import { mapValues, range as _range } from "lodash-es";
import type { CSSProperties } from "react";
import StyleDictionary from "style-dictionary";

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
      color: string;
    };
  };
  opacity: {
    value: number;
    type: "number";
  };
}

interface IDropShadow {
  category: "effect";
  type: "dropShadow";
  radius: number;
  color: string;
  offset: {
    x: number;
    y: number;
  };
  spread: number;
}

const parseGradient = (gradient: IGradient): string => {
  return `linear-gradient(0deg, ${Object.values(gradient.stops)
    .map((stop) => `${stop.color} ${stop.position.value * 100}%`)
    .join(", ")})`;
};

const parseDropShadow = (shadow: IDropShadow): string => {
  return `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${shadow.color}`;
};

const dict = StyleDictionary.extend("./design-system/config.json");

dict.registerTransform({
  name: "lightsaber/attribute",
  type: "attribute",
  transformer: function (token) {
    const originalAttrs = token.original || {};
    const overrideAtrs: Record<string, unknown> = {};

    if (
      token.original?.category === "fill" &&
      token.original.type === "color"
    ) {
      overrideAtrs["category"] = "color";
    }

    return { ...originalAttrs, ...overrideAtrs };
  },
});

dict.registerTransformGroup({
  name: "lightsaber",
  transforms: [
    "lightsaber/attribute",
    "name/cti/camel",
    "size/px",
    "color/css",
  ],
});

type ColorMap = {
  [K in `dark${0 | 1 | 2 | 3}` | `light${0 | 1 | 2 | 3}` | `base`]: string;
};

function autoGradient(color: string, numColors: number) {
  const lab = chroma(color).lab();
  const lRange = 100 * (0.95 - 1 / numColors);
  const lStep = lRange / (numColors - 1);
  const lStart = (100 - lRange) * 0.5;
  const range = _range(lStart, lStart + numColors * lStep, lStep);
  let offset = 9999;
  for (let i = 0; i < numColors; i++) {
    const diff = lab[0] - (range[i] ?? 0);
    if (Math.abs(diff) < Math.abs(offset)) {
      offset = diff;
    }
  }
  return range.map((l) => chroma.lab(l + offset, lab[1], lab[2]));
}

const makeColorMap = (root: string): ColorMap =>
  chroma
    .scale(autoGradient(root, 9))
    .colors(9)
    .reduce((acc, color, i) => {
      if (i < 4) {
        return { ...acc, [`dark${3 - i}`]: color };
      }
      if (i > 4) {
        return { ...acc, [`light${i - 5}`]: color };
      }
      return { ...acc, [`base`]: color };
    }, {}) as ColorMap;

const makePalette = ({
  brand,
  secondary,
}: {
  brand: string;
  secondary: string;
}) => {
  const brandColors = makeColorMap(brand);
  const secondaryColors = makeColorMap(secondary);
  return {
    mono: makeColorMap("#ccc"),
    brand: brandColors,
    secondary: secondaryColors,
  };
};

dict.registerFormat({
  name: "theme",
  formatter: function ({ dictionary }) {
    const mainTheme = generateTheme(
      minifyDictionary(dictionary.tokens) as Record<string, unknown>,
    );
    const dark = pickSubtheme(mainTheme as Record<string, unknown>, "dark");
    const light = pickSubtheme(mainTheme as Record<string, unknown>, "light");
    const darkStr = JSON.stringify(dark, null, 2);
    const lightStr = JSON.stringify(light, null, 2);

    const palette = makePalette({ brand: "#6966fb", secondary: "#4CFB9B" });

    return `
    export const darkRaw = ${darkStr} as const;

    export const lightRaw = ${lightStr} as const;

    export const palette = ${JSON.stringify(palette)} as const;

    export type ThemeRaw = typeof darkRaw & typeof lightRaw;
    `;
  },
});

function minifyDictionary(obj: unknown) {
  if (typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }
  const toRet: Record<string, unknown> = {};
  const kv = obj as Record<string, unknown>;
  if ("value" in kv) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (kv as { value: unknown }).value;
  } else {
    for (const name in kv) {
      // eslint-disable-next-line no-prototype-builtins
      if (kv.hasOwnProperty(name)) {
        toRet[name] = minifyDictionary(kv[name]);
      }
    }
  }
  return toRet;
}

const generateTheme = (
  kv: Record<string, unknown>,
): Record<string, unknown> | string | CSSProperties => {
  if (kv.category === "fill") {
    if ("stops" in kv) {
      return parseGradient(kv as unknown as IGradient);
    }
  }
  if (kv.category === "effect" && kv.type === "dropShadow") {
    return parseDropShadow(kv as unknown as IDropShadow);
  }
  return mapValues(kv, (v) => {
    if (typeof v === "object") {
      return generateTheme(v as Record<string, unknown>);
    }
    return v;
  }) as Record<string, unknown>;
};

const pickSubtheme = (
  kv: Record<string, unknown>,
  subtheme: "dark" | "light",
): Record<string, unknown> | string | CSSProperties => {
  return mapValues(kv, (v) => {
    if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      if ("dark" in v || "light" in v) {
        return obj[subtheme] ?? obj["dark"] ?? obj["light"];
      } else {
        return pickSubtheme(obj, subtheme);
      }
    }
  }) as Record<string, unknown>;
};

dict.buildAllPlatforms();
