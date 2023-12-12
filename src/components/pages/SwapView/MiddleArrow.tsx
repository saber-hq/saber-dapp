import React from "react";
import { FaArrowDown } from "react-icons/fa";
import { styled } from "twin.macro";

interface IProps {
  onClick?: () => void;
}

export const MiddleArrow: React.FC<IProps> = ({ onClick }: IProps) => {
  return (
    <Middle>
      <DividerLeft />
      <DividerRight />
      <ExchangeIcon onClick={onClick}>
        <FaArrowDown />
      </ExchangeIcon>
    </Middle>
  );
};

const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  position: absolute;
  width: calc(50% + 10px);
  height: 1px;
`;

const DividerLeft = styled(Divider)`
  left: -24px;
`;

const DividerRight = styled(Divider)`
  right: -24px;
`;

const Middle = styled.div`
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const ExchangeIcon = styled.div`
  height: 28px;
  width: 28px;
  background: ${({ theme }) => theme.colors.base.secondary};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.divider.secondary};
  svg {
    color: ${({ theme }) => theme.colors.iconselector.icon.default};
    width: 12px;
    height: 12px;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.iconselector.base.hover};
  }
  cursor: pointer;
  transition: 0.1s ease;

  display: flex;
  align-items: center;
  justify-content: center;
`;
