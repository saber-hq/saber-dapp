import { styled } from "twin.macro";

import { breakpoints } from "../../../theme/breakpoints";

/**
 * Two column layout.
 */
export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  grid-column-gap: 12px;
  ${breakpoints.mobile} {
    grid-template-columns: 100%;
    grid-row-gap: 24px;
  }
`;
