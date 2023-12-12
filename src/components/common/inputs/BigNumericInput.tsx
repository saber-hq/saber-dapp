import React from "react";
import { css, styled } from "twin.macro";

interface IProps
  extends Omit<
    React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >,
    "onChange"
  > {
  onChange?: (val: string) => void;
  hasBackground?: boolean;
  integerOnly?: boolean;
}

const DIGIT_ONLY = /^(\d)*$/;
const DECIMAL_ONLY = /^-?\d*(\.\d*)?$/;

export const BigNumericInput: React.FC<IProps> = ({
  onChange,
  integerOnly,
  ...rest
}: IProps) => (
  <StyledInput
    {...rest}
    onChange={(e) => {
      const { value } = e.target;
      if (integerOnly) {
        if (
          value === "" ||
          (DIGIT_ONLY.test(value) && !Number.isNaN(parseInt(value)))
        ) {
          onChange?.(value);
        }
        return;
      }
      if (
        (!Number.isNaN(value) && DECIMAL_ONLY.test(value)) ||
        value === "" ||
        value === "-"
      ) {
        onChange?.(value);
      }
    }}
  />
);

const StyledInput = styled.input<{ hasBackground?: boolean }>`
  ${({ theme }) => theme.mono};
  color: ${({ theme }) => theme.colors.text.bold};
  font-weight: 400;
  font-size: 24px;
  &:disabled {
    color: ${({ theme }) => theme.colors.text.default};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  background: transparent;
  border: none;
  outline: none;
  ${(props) =>
    props.hasBackground &&
    css`
      padding: 0 24px;
      border-radius: 8px;
      background: #1a1b20;
    `}
`;
