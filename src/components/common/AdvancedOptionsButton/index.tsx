import React, { useRef, useState } from "react";
import { styled } from "twin.macro";

import { ReactComponent as OptionsIcon } from "./OptionsIcon.svg";

const AdvancedSettingsModal = React.lazy(
  () => import("./AdvancedSettingsModal"),
);

export const AdvancedOptionsButton: React.FC = () => {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [topMargin, setTopMargin] = useState<number | undefined>(undefined);
  return (
    <Wrapper>
      <Button
        ref={buttonRef}
        onClick={() => {
          const top = buttonRef.current?.getBoundingClientRect().top;
          if (top !== undefined) {
            setTopMargin(window.scrollY + top + 28 + 21);
          }
          setShowOptions(!showOptions);
        }}
      >
        <OptionsIcon />
      </Button>
      <AdvancedSettingsModal
        isOpen={showOptions}
        onDismiss={() => setShowOptions(false)}
        topMargin={topMargin}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const Button = styled.button`
  border-radius: 100%;
  color: ${({ theme }) => theme.colors.iconselector.icon.default};
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: none;
  border: none;

  & > svg {
    height: 12px;
    width: 12px;
  }

  cursor: pointer;
  transition: all 0.3s ease;

  background: ${({ theme }) => theme.colors.iconselector.base.default};
  &:hover {
    background: ${({ theme }) => theme.colors.iconselector.base.hover};
  }

  &:focus {
    outline: none;
  }
`;
