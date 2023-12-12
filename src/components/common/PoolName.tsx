import { styled } from "twin.macro";

import type { Pool } from "../../utils/useEnvironment";
import { PoolIcon } from "./PoolIcon";

interface Props {
  pool: Pool;
}

export const PoolName: React.FC<Props> = ({ pool }: Props) => {
  return (
    <Wrapper>
      <PoolIcon tokens={pool.underlyingIcons} />
      <span>{pool.name}</span>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  color: ${({ theme }) => theme.colors.text.bold};
`;
