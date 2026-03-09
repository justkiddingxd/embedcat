import { useRef, useState, useCallback } from "react";

export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleGripPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      startY.current = e.clientY;
      setDragIdx(index);
      setOverIdx(index);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY && overIdx !== index) {
        setOverIdx(index);
      } else if (e.clientY >= midY && overIdx !== index) {
        setOverIdx(index);
      }
    },
    [overIdx]
  );

  const handleGripPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
        onReorder(dragIdx, overIdx);
      }
      isDragging.current = false;
      setDragIdx(null);
      setOverIdx(null);
    },
    [dragIdx, overIdx, onReorder]
  );

  const getDragProps = useCallback(
    (index: number) => ({
      onPointerMove: handlePointerMove(index),
      style: {
        transition: dragIdx !== null ? "transform 150ms ease, opacity 150ms ease" : undefined,
        transform:
          dragIdx !== null && overIdx !== null && dragIdx !== index
            ? index > dragIdx && index <= overIdx
              ? "translateY(-100%)"
              : index < dragIdx && index >= overIdx
                ? "translateY(100%)"
                : undefined
            : undefined,
        opacity: dragIdx === index ? 0.4 : undefined,
        zIndex: dragIdx === index ? 50 : undefined,
        position: "relative" as const,
      },
    }),
    [dragIdx, overIdx, handlePointerMove]
  );

  const getGripProps = useCallback(
    (index: number) => ({
      onPointerDown: handleGripPointerDown(index),
      onPointerUp: handleGripPointerUp,
      className: "cursor-grab active:cursor-grabbing touch-none",
    }),
    [handleGripPointerDown, handleGripPointerUp]
  );

  return { getDragProps, getGripProps, isDragging: dragIdx !== null };
}
