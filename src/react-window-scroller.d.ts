declare module "react-window-scroller" {
  import type { VariableSizeList } from "react-window";

  const ReactWindowScroller: React.FC<{
    children: (args: {
      ref?: React.LegacyRef<VariableSizeList> | undefined;
      outerRef?: React.Ref<unknown> | undefined;
      style?: React.CSSProperties | undefined;
      /**
       * Called when the list scroll positions changes, as a result of user scrolling or scroll-to method calls.
       */
      onScroll?: ((props: ListOnScrollProps) => unknown) | undefined;
    }) => React.ReactNode;
  }>;
}
