import type { Token } from "@saberhq/token-utils";
import { useState } from "react";
import { styled } from "twin.macro";

interface Props {
  token?: Token | null;
  size?: number;
  className?: string;
}

export const TokenIcon: React.FC<Props> = ({
  className,
  token,
  size = 28,
}: Props) => {
  const [invalid, setInvalid] = useState<boolean>(false);
  return (
    <Wrapper className={className} size={size}>
      {invalid || !token?.icon ? (
        <Placeholder
          title={
            token ? `Icon of token ${token.name} (${token.symbol})` : undefined
          }
        />
      ) : (
        <img
          src={token.icon}
          onError={() => {
            setInvalid(true);
          }}
          alt={`Icon of token ${token.name} (${token.symbol})`}
        />
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div<{ size: number }>`
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;
  & > img {
    height: 100%;
    width: 100%;
    border-radius: 100%;
  }
`;

const Placeholder = styled.div`
  height: 100%;
  width: 100%;
  border: 1px dashed #ccc;
  border-radius: 100%;
`;
