import tw, { styled } from "twin.macro";

export const TextInput = styled.input`
  background: ${({ theme }) => theme.colors.base.tertiary};
  ${tw`border-none outline-none p-2 rounded text-white focus:ring-gray-500`}
`;
