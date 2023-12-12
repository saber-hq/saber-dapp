import { css, styled } from "twin.macro";

export const SliderInput = styled.input<{ value: string }>`
  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    padding: 0 10px;
    overflow: hidden;
    -webkit-appearance: none;
    outline: none;
    background: transparent;

    &::-webkit-slider-runnable-track {
      ${({ value, theme }) => css`
        background: linear-gradient(
          to right,
          #616774 7.29%,
          #403f4c ${value}%,
          ${theme.colors.base.tertiary} ${value}%,
          ${theme.colors.base.tertiary} 100%
        );
      `};
      border-radius: 4px;
      height: 10px;
    }

    &::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
      border-radius: 12px;

      margin-top: -8px;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
      background: ${({ theme }) => theme.colors.text.bold};
      box-shadow: 0px 6px 12px 8px rgba(0, 0, 0, 0.3);
    }
  }
`;
