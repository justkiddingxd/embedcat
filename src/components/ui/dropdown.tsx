"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface DropdownContextValue {
  value: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelect: (value: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null> | null;
  popupRef: React.RefObject<HTMLDivElement | null> | null;
}

const DropdownContext = createContext<DropdownContextValue>({
  value: "",
  open: false,
  setOpen: () => {},
  onSelect: () => {},
  containerRef: null,
  popupRef: null,
});

interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Dropdown({ value, onValueChange, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!popupRef.current || !popupRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onSelect = useCallback(
    (v: string) => {
      onValueChange(v);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <DropdownContext.Provider value={{ value, open, setOpen, onSelect, containerRef, popupRef }}>
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps {
  className?: string;
  size?: "sm" | "default";
  children: ReactNode;
}

export function DropdownTrigger({ className, size = "default", children }: DropdownTriggerProps) {
  const { open, setOpen } = useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "w-full flex items-center justify-between gap-1.5 rounded-md border border-white/[0.06] bg-[#0a0a0b] px-2.5 text-[13px] text-[#fafafa] whitespace-nowrap transition-all duration-150 outline-none select-none hover:border-white/[0.12] hover:bg-[#0f0f10] group",
        size === "sm" ? "h-7" : "h-8",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 truncate flex-1 text-left">{children}</span>
      <ChevronDown
        className={cn(
          "size-3.5 text-[#52525b] shrink-0 transition-transform duration-150 group-hover:text-[#a1a1aa]",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

interface DropdownValueProps {
  placeholder?: string;
  children?: ReactNode;
}

export function DropdownValue({ placeholder, children }: DropdownValueProps) {
  if (children) {
    return <>{children}</>;
  }
  return <span className="text-[#3f3f46]">{placeholder}</span>;
}

interface DropdownContentProps {
  className?: string;
  children: ReactNode;
}

export function DropdownContent({ className, children }: DropdownContentProps) {
  const { open, containerRef, popupRef } = useContext(DropdownContext);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const MAX_H = 224; // max-h-56 = 14rem = 224px

  useEffect(() => {
    if (!open || !containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    if (spaceBelow >= MAX_H || spaceBelow >= spaceAbove) {
      // Show below
      setSide("bottom");
      setStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_H, spaceBelow),
      });
    } else {
      // Show above
      setSide("top");
      setStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_H, spaceAbove),
      });
    }
  }, [open, containerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popupRef}
      style={style}
      className={cn(
        "z-[9999] rounded-md border border-white/[0.08] bg-[#111113] shadow-xl shadow-black/40 overflow-hidden animate-in fade-in-0 duration-150",
        side === "bottom" ? "slide-in-from-top-1" : "slide-in-from-bottom-1",
        className,
      )}
    >
      <div className="overflow-y-auto py-1" style={{ maxHeight: "inherit" }}>{children}</div>
    </div>,
    document.body,
  );
}

interface DropdownItemProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function DropdownItem({ value: itemValue, className, children }: DropdownItemProps) {
  const { value, onSelect } = useContext(DropdownContext);
  const active = value === itemValue;

  return (
    <button
      type="button"
      onClick={() => onSelect(itemValue)}
      className={cn(
        "w-full px-3 py-1.5 flex items-center gap-2 text-left text-[13px] transition-colors",
        active
          ? "bg-[#5865f2]/15 text-[#fafafa]"
          : "text-[#d4d4d8] hover:bg-white/[0.04] hover:text-[#fafafa]",
        className,
      )}
    >
      <span className="flex items-center gap-2 flex-1 truncate">{children}</span>
      {active && <Check className="size-3 text-[#5865f2] shrink-0" />}
    </button>
  );
}

interface DropdownLabelProps {
  className?: string;
  children: ReactNode;
}

export function DropdownLabel({ className, children }: DropdownLabelProps) {
  return (
    <div
      className={cn(
        "px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#52525b] uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </div>
  );
}
