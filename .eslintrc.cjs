"use strict";

// Required in Yarn 2 (PNP)
// https://github.com/yarnpkg/berry/issues/8#issuecomment-681069562
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  ignorePatterns: ["*.js"],
  extends: ["@saberhq/eslint-config-react"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "react/no-unknown-property": ["error", { ignore: ["css", "tw"] }],
  },
};
