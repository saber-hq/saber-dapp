import type { Theme } from "@emotion/react";
import tw, { css, styled, theme } from "twin.macro";

export type IButtonVariant = keyof Theme["colors"]["button"] | "danger";

const danger = {
  base: {
    default: "linear-gradient(0deg, #616774 0%, #403f4c 100%)",
    disabled: `linear-gradient(180deg, ${theme`colors.red.700`} 0%, ${theme`colors.red.900`} 100%)`,
    hover: "linear-gradient(0deg, #767b87 0%, #5e5d6f 100%)",
    pressed: "linear-gradient(0deg, #4c515b 0%, #35353e 100%)",
  },
  buttontext: { default: "#fff", disabled: "#fff", muted: "#fff" },
};

export const Button = styled.button<{
  variant?: IButtonVariant;
  size?: "small" | "medium" | "large";
}>`
  ${({ theme, variant = "primary" }) => {
    const buttonColors =
      variant === "danger"
        ? danger
        : (theme.colors.button[variant] as {
            readonly buttontext: {
              readonly muted?: string;
              readonly disabled?: string;
              readonly default: string;
            };
            readonly base: {
              readonly default: string;
              readonly hover: string;
              readonly pressed: string;
              readonly disabled: string;
            };
          });
    return css`
      color: ${buttonColors.buttontext.default};
      background: ${buttonColors.base.default.replace("0deg", "180deg")};
      &:hover {
        background: ${buttonColors.base.hover.replace("0deg", "180deg")};
      }
      &:disabled {
        color: ${buttonColors.buttontext.disabled ??
        buttonColors.buttontext.muted};
        background: ${buttonColors.base.disabled.replace("0deg", "180deg")};
      }
      &:active:not(:disabled) {
        background: ${buttonColors.base.pressed.replace("0deg", "180deg")};
      }
    `;
  }}

  ${({ theme, size = "small" }) =>
    size === "large"
      ? css`
          height: 64px;
          width: 100%;
          border-radius: 8px;
          ${theme.buttontext};
        `
      : size === "medium"
        ? css`
            height: 48px;
            width: 100%;
            border-radius: 8px;
            ${theme.buttontext};
          `
        : css`
            height: 43px;
            padding: 0 12px;
            border-radius: 16px;
            ${theme.smallbuttontext};
          `};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  box-shadow: none;
  border: none;
  outline: 0;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
  }
  ${tw`transition-colors`}
`;
