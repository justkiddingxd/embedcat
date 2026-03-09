"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type View = "days" | "months" | "years";

interface DateTimePickerProps {
  value?: string;
  onChange: (iso: string | undefined) => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const parsed = value ? new Date(value) : null;
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());
  const [selectedDay, setSelectedDay] = useState(parsed?.getDate() ?? now.getDate());
  const [hours, setHours] = useState(parsed ? pad(parsed.getHours()) : "00");
  const [minutes, setMinutes] = useState(parsed ? pad(parsed.getMinutes()) : "00");
  const [view, setView] = useState<View>("days");

  const yearRangeStart = viewYear - (viewYear % 12);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; current: boolean }[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    setSelectedDay(day);
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const d = new Date(viewYear, viewMonth, day, h, m);
    onChange(d.toISOString());
  };

  const selectMonth = (month: number) => {
    setViewMonth(month);
    setView("days");
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setView("months");
  };

  const updateTime = (h: string, m: string) => {
    setHours(h);
    setMinutes(m);
    const hNum = Math.min(23, Math.max(0, parseInt(h) || 0));
    const mNum = Math.min(59, Math.max(0, parseInt(m) || 0));
    const d = new Date(viewYear, viewMonth, selectedDay, hNum, mNum);
    onChange(d.toISOString());
  };

  const clear = () => {
    onChange(undefined);
  };

  const isToday = (day: number) => {
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return day === parsed.getDate() && viewMonth === parsed.getMonth() && viewYear === parsed.getFullYear();
  };

  const displayText = parsed
    ? `${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
    : "";

  const headerClick = () => {
    if (view === "days") setView("months");
    else if (view === "months") setView("years");
  };

  const headerLabel =
    view === "days"
      ? `${MONTHS[viewMonth]} ${viewYear}`
      : view === "months"
        ? `${viewYear}`
        : `${yearRangeStart} – ${yearRangeStart + 11}`;

  const prevNav = () => {
    if (view === "days") prevMonth();
    else if (view === "months") setViewYear(viewYear - 1);
    else setViewYear(viewYear - 12);
  };

  const nextNav = () => {
    if (view === "days") nextMonth();
    else if (view === "months") setViewYear(viewYear + 1);
    else setViewYear(viewYear + 12);
  };

  return (
    <Popover onOpenChange={() => setView("days")}>
      <PopoverTrigger className="flex items-center gap-1.5 w-full group">
        <div className="flex h-7 flex-1 items-center rounded-md border border-white/[0.06] bg-[#0a0a0b] px-2 text-xs transition-colors group-hover:border-white/[0.12]">
          <Calendar className="size-3 text-[#52525b] mr-1.5 shrink-0" />
          {displayText ? (
            <span className="text-[#e4e4e7]">{displayText}</span>
          ) : (
            <span className="text-[#3f3f46]">Select date & time</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0 border-white/[0.08] bg-[#111113] shadow-xl shadow-black/40"
        align="start"
        sideOffset={4}
      >
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between">
            <button onClick={prevNav} className="p-1 rounded text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={headerClick}
              className="text-xs font-semibold text-[#e4e4e7] hover:text-white hover:bg-white/[0.06] rounded px-2 py-0.5 transition-colors"
            >
              {headerLabel}
            </button>
            <button onClick={nextNav} className="p-1 rounded text-[#71717a] hover:text-white hover:bg-white/[0.06] transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {view === "days" && (
            <div className="grid grid-cols-7 gap-0">
              {DAYS.map((d) => (
                <div key={d} className="flex items-center justify-center h-6 text-[10px] font-medium text-[#52525b]">
                  {d}
                </div>
              ))}
              {calendarDays.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => cell.current && selectDay(cell.day)}
                  disabled={!cell.current}
                  className={`flex items-center justify-center h-7 text-[11px] rounded transition-all ${
                    !cell.current
                      ? "text-[#27272a] cursor-default"
                      : isSelected(cell.day)
                        ? "bg-[#5865f2] text-white font-semibold"
                        : isToday(cell.day)
                          ? "text-[#5865f2] font-semibold hover:bg-[#5865f2]/10"
                          : "text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {cell.day}
                </button>
              ))}
            </div>
          )}

          {view === "months" && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_SHORT.map((m, i) => (
                <button
                  key={m}
                  onClick={() => selectMonth(i)}
                  className={`flex items-center justify-center h-8 text-xs rounded transition-all ${
                    i === viewMonth && viewYear === (parsed?.getFullYear() ?? -1)
                      ? "bg-[#5865f2] text-white font-semibold"
                      : i === now.getMonth() && viewYear === now.getFullYear()
                        ? "text-[#5865f2] font-semibold hover:bg-[#5865f2]/10"
                        : "text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {view === "years" && (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => (
                <button
                  key={y}
                  onClick={() => selectYear(y)}
                  className={`flex items-center justify-center h-8 text-xs rounded transition-all ${
                    y === viewYear && viewYear === (parsed?.getFullYear() ?? -1)
                      ? "bg-[#5865f2] text-white font-semibold"
                      : y === now.getFullYear()
                        ? "text-[#5865f2] font-semibold hover:bg-[#5865f2]/10"
                        : "text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-white/[0.06] pt-2">
            <Clock className="size-3 text-[#52525b] shrink-0" />
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={hours}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                  updateTime(v, minutes);
                }}
                onBlur={() => setHours(pad(Math.min(23, parseInt(hours) || 0)))}
                className="w-8 h-6 rounded bg-[#0a0a0b] border border-white/[0.06] text-center text-xs text-[#e4e4e7] font-mono focus:border-[#5865f2] focus:outline-none"
                maxLength={2}
              />
              <span className="text-xs text-[#52525b] font-bold">:</span>
              <input
                type="text"
                value={minutes}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                  updateTime(hours, v);
                }}
                onBlur={() => setMinutes(pad(Math.min(59, parseInt(minutes) || 0)))}
                className="w-8 h-6 rounded bg-[#0a0a0b] border border-white/[0.06] text-center text-xs text-[#e4e4e7] font-mono focus:border-[#5865f2] focus:outline-none"
                maxLength={2}
              />
            </div>
            <span className="text-[10px] text-[#3f3f46]">UTC</span>
            <div className="flex-1" />
            {parsed && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={clear}
                className="text-[#52525b] hover:text-red-400 transition-colors"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
