"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Pipette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DISCORD_PRESETS = [
  0x5865f2, 0x2f3136, 0x57f287, 0xfee75c, 0xeb459e, 0xed4245,
  0xf47b67, 0xf8a532, 0xe67e22, 0x1abc9c, 0x2ecc71,
  0x3498db, 0x9b59b6, 0xe91e63, 0x11806a, 0x1f8b4c,
  0x206694, 0x71368a, 0xad1457, 0x992d22, 0xa84300,
];

function intToHex(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function intToRgb(n: number): [number, number, number] {
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToInt(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

function drawSvCanvas(canvas: HTMLCanvasElement, hue: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const [hr, hg, hb] = hsvToRgb(hue, 1, 1);
  const hueColor = `rgb(${hr},${hg},${hb})`;

  ctx.fillStyle = hueColor;
  ctx.fillRect(0, 0, w, h);

  const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
  whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
  whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = whiteGrad;
  ctx.fillRect(0, 0, w, h);

  const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
  blackGrad.addColorStop(0, "rgba(0,0,0,0)");
  blackGrad.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = blackGrad;
  ctx.fillRect(0, 0, w, h);
}

function drawHueBar(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#ff0000");
  grad.addColorStop(1 / 6, "#ffff00");
  grad.addColorStop(2 / 6, "#00ff00");
  grad.addColorStop(3 / 6, "#00ffff");
  grad.addColorStop(4 / 6, "#0000ff");
  grad.addColorStop(5 / 6, "#ff00ff");
  grad.addColorStop(1, "#ff0000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

const SV_WIDTH = 216;
const SV_HEIGHT = 150;
const HUE_WIDTH = 216;
const HUE_HEIGHT = 14;

interface ColorPickerProps {
  color: number;
  onChange: (color: number) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(intToHex(color));
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);

  const rgb = intToRgb(color);
  const [h, s, v] = rgbToHsv(...rgb);

  const hueRef = useRef(h);
  const [hue, setHueState] = useState(h);
  const [sat, setSat] = useState(s);
  const [val, setVal] = useState(v);

  const svCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingSv = useRef(false);
  const draggingHue = useRef(false);
  const internalUpdate = useRef(false);

  useEffect(() => {
    setSupportsEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    if (internalUpdate.current) {
      internalUpdate.current = false;
      return;
    }
    const [nr, ng, nb] = intToRgb(color);
    const [nh, ns, nv] = rgbToHsv(nr, ng, nb);
    if (ns > 0.01) {
      hueRef.current = nh;
      setHueState(nh);
    }
    setSat(ns);
    setVal(nv);
    setHexInput(intToHex(color));
  }, [color]);

  useEffect(() => {
    if (svCanvasRef.current) drawSvCanvas(svCanvasRef.current, hue);
  }, [hue]);

  const svCanvasRefCb = useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      svCanvasRef.current = node;
      drawSvCanvas(node, hueRef.current);
    }
  }, []);

  const hueCanvasRefCb = useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      hueCanvasRef.current = node;
      drawHueBar(node);
    }
  }, []);

  const applyColor = useCallback(
    (newH: number, newS: number, newV: number) => {
      const [r, g, b] = hsvToRgb(newH, newS, newV);
      const int = rgbToInt(r, g, b);
      internalUpdate.current = true;
      setHexInput(intToHex(int));
      onChange(int);
    },
    [onChange]
  );

  const handleSvInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = svCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const newS = x;
      const newV = 1 - y;
      setSat(newS);
      setVal(newV);
      applyColor(hue, newS, newV);
    },
    [hue, applyColor]
  );

  const handleHueInteraction = useCallback(
    (clientX: number) => {
      const canvas = hueCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newH = x * 360;
      hueRef.current = newH;
      setHueState(newH);
      applyColor(newH, sat, val);
    },
    [sat, val, applyColor]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingSv.current) handleSvInteraction(e.clientX, e.clientY);
      if (draggingHue.current) handleHueInteraction(e.clientX);
    };
    const onUp = () => {
      draggingSv.current = false;
      draggingHue.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [handleSvInteraction, handleHueInteraction]);

  const handleHexChange = useCallback(
    (value: string) => {
      setHexInput(value);
      const cleaned = value.replace(/[^0-9a-fA-F#]/g, "");
      const hex = cleaned.startsWith("#") ? cleaned.slice(1) : cleaned;
      if (hex.length === 6) {
        const parsed = parseInt(hex, 16);
        if (!isNaN(parsed)) onChange(parsed);
      }
    },
    [onChange]
  );

  const handleEyeDropper = useCallback(async () => {
    try {
      const dropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const result = await dropper.open();
      onChange(hexToInt(result.sRGBHex));
    } catch { void 0; }
  }, [onChange]);

  const hexValue = intToHex(color);
  const svThumbLeft = `${sat * 100}%`;
  const svThumbTop = `${(1 - val) * 100}%`;
  const hueThumbLeft = `${(hue / 360) * 100}%`;

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-1.5 group cursor-pointer"
      >
        <div
          className="w-6 h-6 rounded border border-white/[0.1] shadow-sm transition-shadow group-hover:shadow-md group-hover:border-white/[0.2]"
          style={{ backgroundColor: hexValue }}
        />
        <span className="font-mono text-xs text-[#a1a1aa] group-hover:text-white transition-colors">
          {hexValue}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-[240px] p-0 border-white/[0.08] bg-[#111113] shadow-xl shadow-black/40"
        align="start"
        sideOffset={4}
      >
        <div className="p-2 space-y-2">
          <div
            className="relative rounded cursor-crosshair overflow-hidden"
            style={{ width: "100%", height: `${SV_HEIGHT}px` }}
            onPointerDown={(e) => {
              draggingSv.current = true;
              handleSvInteraction(e.clientX, e.clientY);
            }}
          >
            <canvas
              ref={svCanvasRefCb}
              width={SV_WIDTH}
              height={SV_HEIGHT}
              className="w-full h-full block"
            />
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(0,0,0,0.3)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: svThumbLeft, top: svThumbTop }}
            />
          </div>

          <div
            className="relative rounded-sm cursor-pointer overflow-hidden"
            style={{ width: "100%", height: `${HUE_HEIGHT}px` }}
            onPointerDown={(e) => {
              draggingHue.current = true;
              handleHueInteraction(e.clientX);
            }}
          >
            <canvas
              ref={hueCanvasRefCb}
              width={HUE_WIDTH}
              height={HUE_HEIGHT}
              className="w-full h-full block"
            />
            <div
              className="absolute top-1/2 w-2 h-full rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: hueThumbLeft }}
            />
          </div>

          <div className="grid grid-cols-10 gap-1">
            {DISCORD_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => onChange(preset)}
                className={`w-full aspect-square rounded-sm border transition-all hover:scale-110 ${
                  color === preset
                    ? "border-white ring-1 ring-white/30 scale-110"
                    : "border-transparent hover:border-white/20"
                }`}
                style={{ backgroundColor: intToHex(preset) }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded border border-white/[0.1] shrink-0"
              style={{ backgroundColor: hexValue }}
            />
            <Input
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="h-7 flex-1 font-mono text-xs bg-[#0a0a0b] border-white/[0.06] text-[#fafafa]"
              maxLength={7}
              spellCheck={false}
            />
            {supportsEyeDropper && (
              <button
                onClick={handleEyeDropper}
                className="flex items-center justify-center w-7 h-7 rounded border border-white/[0.06] bg-[#0a0a0b] text-[#71717a] hover:text-[#5865f2] hover:border-[#5865f2]/40 transition-colors shrink-0"
              >
                <Pipette className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
