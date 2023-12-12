import { styled } from "twin.macro";

/**
 * A basic HTML table.
 */
export const BasicTable = styled.table`
  width: 100%;
  td,
  th {
    padding: 4px;
  }
  th {
    text-align: left;
    color: ${({ theme }) => theme.colors.text.bold};
  }
`;
