import type { Theme } from "@emotion/react";
import React, { useState } from "react";
import tw, { css, styled } from "twin.macro";

import { breakpoints } from "../../../theme/breakpoints";

interface IOption<V> {
  key: V;
  label: string;
}

interface IProps<V = string> {
  value: V;
  onSelect: (value: V) => void;
  options: readonly IOption<V>[];
  hasCustomFallback?: boolean;
  optionPadding?: number;
}

export const ButtonGroup = <V extends string>({
  options,
  value,
  onSelect,
  hasCustomFallback,
  optionPadding,
}: IProps<V>): React.ReactElement => {
  const optionKeys = options.map((opt) => opt.key);
  const [useCustom, setUseCustom] = useState<boolean>(
    !optionKeys.includes(value),
  );

  return (
    <GroupWrapper>
      {options.map(({ key, label }) => (
        <GroupOption
          key={key}
          role="button"
          className={value === key && !useCustom ? "is-active" : undefined}
          onClick={() => {
            onSelect(key);
            setUseCustom(false);
          }}
          optionPadding={optionPadding}
        >
          {label}
        </GroupOption>
      ))}
      {hasCustomFallback && (
        <CustomGroupOption
          className={useCustom ? "is-active" : undefined}
          onClick={() => {
            setUseCustom(true);
            if (!useCustom) {
              onSelect("" as V);
            }
          }}
        >
          {!useCustom ? (
            <span
              css={(theme: Theme) => css`
                color: ${theme.colors.text.muted};
              `}
            >
              0.1
            </span>
          ) : (
            <CustomInput
              type="number"
              value={value}
              placeholder="0.1"
              min="0"
              max="100"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              // approximate width of text box
              css={css`
                width: calc(
                  24px +
                    ${value === "" ? 3 : Math.max(value.toString().length, 3)}ch
                );
              `}
              onChange={(e) => {
                try {
                  const numStr = e.target.value;
                  const num = parseFloat(numStr);
                  if (num > 100 || num < 0) {
                    return;
                  }
                  onSelect(numStr as V);
                  // eslint-disable-next-line no-empty
                } catch (err) {}
              }}
            />
          )}
          <span>%</span>
        </CustomGroupOption>
      )}
    </GroupWrapper>
  );
};

const CustomInput = styled.input`
  ${tw`focus:ring-0`}
  margin: 0;
  background-color: transparent;
  border: none;
  outline: none;

  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const GroupWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  ${breakpoints.mobile} {
    flex-wrap: wrap;
  }
  gap: 4px;
  width: 100%;
`;

const GroupOption = styled.div<{ optionPadding?: number }>`
  ${tw`flex items-center justify-center`}
  height: 40px;
  min-width: 72px;
  ${breakpoints.mobile} {
    width: 33%;
    flex-grow: 1;
  }

  ${({ optionPadding }) =>
    optionPadding !== undefined &&
    css`
      padding: 0 ${optionPadding}px;
    `}
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  line-height: 16px;

  transition: all 0.1s ease;

  border: 1px solid ${({ theme }) => theme.colors.divider.primary};
  color: ${({ theme }) => theme.colors.text.bold};

  &:hover {
    background: ${({ theme }) => theme.colors.divider.primary};
  }

  &.is-active {
    background: ${({ theme }) => theme.colors.button.secondary.base.default};
  }

  cursor: pointer;
  user-select: none;
`;

const CustomGroupOption = styled(GroupOption)`
  flex-grow: 1;
  position: relative;
`;
