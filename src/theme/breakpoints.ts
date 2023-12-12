export const BREAKPOINT_SIZES = [576, 768, 992, 1200] as const;

const mq = BREAKPOINT_SIZES.map((bp) => `@media (max-width: ${bp}px)`);

export const breakpoints = {
  mobile: mq[0],
  tablet: mq[1],
  medium: mq[2],
};
