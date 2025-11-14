import { useEffect, useRef, useState, type RefObject } from 'react';
import { XYDrag, type XYDragInstance } from '@flow/system';

import { handleNodeClick } from '../components/Nodes/utils';
import { useStoreApi } from './useStore';

type UseDragParams = {
  nodeRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  noDragClassName?: string;
  handleSelector?: string;
  nodeId?: string;
  isSelectable?: boolean;
  nodeClickDistance?: number;
};

/**
 * Hook for calling XYDrag helper from @flow/system.
 *
 * @internal
 */
export function useDrag({
  nodeRef,
  disabled = false,
  noDragClassName,
  handleSelector,
  nodeId,
  isSelectable,
  nodeClickDistance,
}: UseDragParams) {
  const store = useStoreApi();
  const [dragging, setDragging] = useState<boolean>(false);
  const xyDrag = useRef<XYDragInstance | null>(null);

  useEffect(() => {
    xyDrag.current = XYDrag({
      getStoreItems: () => store.getState(),
      onNodeMouseDown: (id: string) => {
        handleNodeClick({
          id,
          store,
          nodeRef,
        });
      },
      onDragStart: () => {
        setDragging(true);
      },
      onDragStop: () => {
        setDragging(false);
      },
    });
  }, []);

  useEffect(() => {
    if (disabled) {
      xyDrag.current?.destroy();
    } else if (nodeRef.current) {
      xyDrag.current?.update({
        noDragClassName,
        handleSelector,
        domNode: nodeRef.current,
        isSelectable,
        nodeId,
        nodeClickDistance,
      });
      return () => {
        xyDrag.current?.destroy();
      };
    }
  }, [noDragClassName, handleSelector, disabled, isSelectable, nodeRef, nodeId]);

  return dragging;
}
