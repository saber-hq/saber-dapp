import React, { useEffect, useRef } from "react";
import type { ListChildComponentProps } from "react-window";
import { VariableSizeList } from "react-window";
import { ReactWindowScroller } from "react-window-scroller";
import invariant from "tiny-invariant";

import type { PoolWithUserBalance } from "../../../utils/exchange/useAllPoolsWithUserBalances";
import { PoolCard } from "./PoolCard";
import { PoolCardPlaceholder } from "./PoolCardPlaceholder";

interface Props {
  pools: PoolWithUserBalance[];
}

const PoolListInner = (
  props: ListChildComponentProps<PoolWithUserBalance[]>,
) => {
  const { data, index, style, isScrolling } = props;
  if (isScrolling) {
    return (
      <div style={style}>
        <PoolCardPlaceholder />
      </div>
    );
  }

  const p = data[index];
  invariant(p, "pool must exist");

  return (
    <div style={style}>
      <PoolCard poolID={p.id} pool={p.pool} />
    </div>
  );
};

const PoolList = React.memo(PoolListInner);

const VirtualizedPoolInner: React.FC<Props> = ({ pools }: Props) => {
  const getItemSize = (index: number) => {
    const pool = pools[index];
    const noSources = !!pool?.pool.underlyingIcons.every(
      (p) => !p.info.extensions?.source,
    );

    // TODO(michael): Handle show balance case
    if (noSources) {
      return 184 + 24;
    }
    return 214 + 24;
  };

  const listRef = useRef<VariableSizeList<PoolWithUserBalance[]> | null>(null);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [pools]);

  return (
    <ReactWindowScroller>
      {({ ref, outerRef, style, onScroll }) => (
        <VariableSizeList<PoolWithUserBalance[]>
          itemKey={(index, data) => data[index]?.id ?? index}
          ref={(list) => {
            if (ref) {
              if (typeof ref !== "string" && typeof ref !== "function") {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ref.current = list;
              }
            }
            if (listRef) {
              listRef.current = list;
            }
          }}
          outerRef={outerRef}
          style={style}
          onScroll={onScroll}
          height={window.innerHeight}
          itemCount={pools.length}
          itemSize={getItemSize}
          itemData={pools}
          width="100%"
          useIsScrolling={true}
        >
          {PoolList}
        </VariableSizeList>
      )}
    </ReactWindowScroller>
  );
};

export const VirtualizedPoolList = VirtualizedPoolInner;
