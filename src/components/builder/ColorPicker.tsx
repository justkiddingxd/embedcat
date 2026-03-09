"use client";

import { useState, useCallback, useEffect } from "react";
import { Pipette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DISCORD_PRESETS = [
  0x5865f2, 0x57f287, 0xfee75c, 0xeb459e, 0xed4245,
  0xf47b67, 0xf8a532, 0xe67e22, 0x1abc9c, 0x2ecc71,
  0x3498db, 0x9b59b6, 0xe91e63, 0x11806a, 0x1f8b4c,
  0x206694, 0x71368a, 0xad1457, 0x992d22, 0xa84300,
];

const GRADIENT_COLORS = [
  "#ff0000", "#ff8000", "#ffff00", "#80ff00", "#00ff00",
  "#00ff80", "#00ffff", "#0080ff", "#0000ff", "#8000ff",
  "#ff00ff", "#ff0080",
];

function intToHex(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function drawGradient(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  const hueGradient = ctx.createLinearGradient(0, 0, w, 0);
  GRADIENT_COLORS.forEach((c, i) => {
    hueGradient.addColorStop(i / (GRADIENT_COLORS.length - 1), c);
  });
  ctx.fillStyle = hueGradient;
  ctx.fillRect(0, 0, w, h);

  const whiteGradient = ctx.createLinearGradient(0, 0, 0, h / 2);
  whiteGradient.addColorStop(0, "rgba(255,255,255,0.8)");
  whiteGradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = whiteGradient;
  ctx.fillRect(0, 0, w, h / 2);

  const blackGradient = ctx.createLinearGradient(0, h / 2, 0, h);
  blackGradient.addColorStop(0, "rgba(0,0,0,0)");
  blackGradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = blackGradient;
  ctx.fillRect(0, h / 2, w, h / 2);
}

interface ColorPickerProps {
  color: number;
  onChange: (color: number) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(intToHex(color));
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setSupportsEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    setHexInput(intToHex(color));
  }, [color]);

  const canvasRefCallback = useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      setCanvasEl(node);
      drawGradient(node);
    }
  }, []);

  const pickFromCanvas = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasEl) return;
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;
      const rect = canvasEl.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (canvasEl.width / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasEl.height / rect.height));
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]);
      onChange(hex);
    },
    [onChange, canvasEl]
  );

  const handleCanvasDrag = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.buttons !== 1) return;
      pickFromCanvas(e);
    },
    [pickFromCanvas]
  );

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
          <canvas
            ref={canvasRefCallback}
            width={216}
            height={80}
            className="w-full h-[80px] rounded cursor-crosshair"
            onClick={pickFromCanvas}
            onMouseMove={handleCanvasDrag}
          />

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
