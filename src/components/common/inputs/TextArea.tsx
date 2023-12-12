import { styled } from "twin.macro";

export const TextArea = styled.textarea`
  border: none;
  outline: none;
  padding: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.base.tertiary};
`;
