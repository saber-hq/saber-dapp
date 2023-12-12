import React from "react";
import { styled } from "twin.macro";

interface IProps {
  className?: string;
  items: readonly {
    title: string;
    href: string;
    Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  }[];
}

export const MenuDropdown: React.FC<IProps> = ({
  className,
  items,
}: IProps) => {
  return (
    <Wrapper className={className}>
      {items.map((item) => (
        <Item
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <item.Icon />
          <span>{item.title}</span>
        </Item>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.modal.base.default};
  box-shadow: ${({ theme }) => theme.modalshadow};
  padding: 24px;

  display: grid;
  grid-auto-flow: row;
  grid-row-gap: 4px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
`;

const Item = styled.a`
  height: 44px;
  &:hover {
    background: ${({ theme }) => theme.colors.modal.item.base.hover};
  }

  display: flex;
  align-items: center;
  padding: 0 12px;
  span {
    margin-left: 12px;
  }
  color: ${({ theme }) => theme.colors.text.default};
  &:hover {
    color: ${({ theme }) => theme.colors.text.bold};
  }
  & > svg {
    height: 20px;
    width: 20px;
  }
`;
