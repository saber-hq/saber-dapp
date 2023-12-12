import { useEffect, useState } from "react";

import { BREAKPOINT_SIZES } from "../theme/breakpoints";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowDimensions(): {
  width: number;
  height: number;
  isMobile: boolean;
} {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    ...windowDimensions,
    isMobile: windowDimensions.width < BREAKPOINT_SIZES[0],
  };
}
