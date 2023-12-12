import { styled } from "twin.macro";

export const InnerContainer = styled.div<{ noPad?: boolean }>`
  background: ${({ theme }) => theme.colors.base.secondary};
  border-radius: 16px;
  padding: ${(props) => !props.noPad && "24px"};
`;
