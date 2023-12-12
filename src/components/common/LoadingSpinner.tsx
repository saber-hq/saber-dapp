import { ImSpinner8 } from "react-icons/im";
import { styled } from "twin.macro";

export const LoadingSpinner = styled(ImSpinner8)`
  animation-name: spin;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
