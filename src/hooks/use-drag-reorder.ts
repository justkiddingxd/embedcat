import { useRef, useState, useCallback, useEffect } from "react";

export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cloneRef = useRef<HTMLElement | null>(null);
  const offsetY = useRef(0);
  const itemRects = useRef<DOMRect[]>([]);
  const sourceIdx = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (cloneRef.current) {
      cloneRef.current.remove();
      cloneRef.current = null;
    }
    setDragIdx(null);
    setOverIdx(null);
    sourceIdx.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    if (dragIdx === null) return;

    const onMove = (e: PointerEvent) => {
      if (!cloneRef.current || !containerRef.current) return;
      cloneRef.current.style.top = `${e.clientY - offsetY.current}px`;

      const children = Array.from(containerRef.current.children) as HTMLElement[];
      for (let i = 0; i < itemRects.current.length; i++) {
        const rect = children[i]?.getBoundingClientRect();
        if (!rect) continue;
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          setOverIdx(i);
          return;
        }
      }
      setOverIdx(itemRects.current.length - 1);
    };

    const onUp = () => {
      if (sourceIdx.current !== null && overIdx !== null && sourceIdx.current !== overIdx) {
        onReorder(sourceIdx.current, overIdx);
      }
      cleanup();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragIdx, overIdx, onReorder, cleanup]);

  const startDrag = useCallback((index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const grip = e.currentTarget as HTMLElement;
    const card = grip.closest("[data-drag-item]") as HTMLElement | null;
    if (!card) return;

    const container = card.parentElement;
    if (!container) return;
    containerRef.current = container as HTMLDivElement;

    const children = Array.from(container.children) as HTMLElement[];
    itemRects.current = children.map((c) => c.getBoundingClientRect());

    const rect = card.getBoundingClientRect();
    offsetY.current = e.clientY - rect.top;

    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.9";
    clone.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
    clone.style.borderRadius = "8px";
    clone.style.transition = "box-shadow 150ms ease";
    document.body.appendChild(clone);
    cloneRef.current = clone;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    sourceIdx.current = index;
    setDragIdx(index);
    setOverIdx(index);
  }, []);

  const getDragProps = useCallback(
    (index: number) => ({
      "data-drag-item": true,
      style: {
        transition: dragIdx !== null ? "transform 200ms cubic-bezier(0.2,0,0,1), opacity 200ms ease" : undefined,
        transform:
          dragIdx !== null && overIdx !== null && dragIdx !== index
            ? index >= Math.min(dragIdx, overIdx) && index <= Math.max(dragIdx, overIdx)
              ? overIdx < dragIdx
                ? index >= overIdx && index < dragIdx
                  ? "translateY(var(--drag-item-h, 0px))"
                  : undefined
                : index > dragIdx && index <= overIdx
                  ? "translateY(calc(-1 * var(--drag-item-h, 0px)))"
                  : undefined
              : undefined
            : undefined,
        opacity: dragIdx === index ? 0.3 : undefined,
        position: "relative" as const,
      },
    }),
    [dragIdx, overIdx]
  );

  const getGripProps = useCallback(
    (index: number) => ({
      onPointerDown: (e: React.PointerEvent) => startDrag(index, e),
    }),
    [startDrag]
  );

  const getContainerProps = useCallback(() => {
    const updateHeightVar = (el: HTMLDivElement | null) => {
      if (!el) return;
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length > 0) {
        const gap = parseFloat(getComputedStyle(el).gap) || 0;
        const h = children[0].offsetHeight + gap;
        el.style.setProperty("--drag-item-h", `${h}px`);
      }
    };
    return { ref: updateHeightVar };
  }, []);

  return { getDragProps, getGripProps, getContainerProps, isDragging: dragIdx !== null };
}
