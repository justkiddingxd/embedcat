import { useRef, useCallback } from "react";

export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  const getDragProps = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        dragIdx.current = index;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
        requestAnimationFrame(() =>
          (e.currentTarget as HTMLElement).classList.add("opacity-30")
        );
      },
      onDragEnd: (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove("opacity-30");
        if (
          dragIdx.current !== null &&
          overIdx.current !== null &&
          dragIdx.current !== overIdx.current
        ) {
          onReorder(dragIdx.current, overIdx.current);
        }
        dragIdx.current = null;
        overIdx.current = null;
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        overIdx.current = index;
      },
    }),
    [onReorder]
  );

  return getDragProps;
}
