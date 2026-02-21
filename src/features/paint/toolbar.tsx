"use client";

import Countdown from "@/components/countdown";
import {
  ArrowUpCircle,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Trash,
  UndoIcon,
  RedoIcon,
  GridIcon,
  HandIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Action } from "./canvas-reducer";

export default function Toolbar({
  day,
  startedAt,
  epochDuration,
  theme,
  palette,
  colorIndex,
  dispatch,
  onSave,
  remaining,
  canUndo,
  canRedo,
  showGrid,
  isPanning,
  onTogglePan,
  backgroundOpacity,
  onBackgroundOpacityChange,
}: {
  day: number;
  startedAt: bigint;
  epochDuration: bigint;
  theme: string;
  palette: string[];
  colorIndex: number;
  dispatch: (action: Action) => void;
  onSave: () => void;
  remaining: bigint | null;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  isPanning: boolean;
  onTogglePan: () => void;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (opacity: number) => void;
}) {
  return (
    <div className="flex flex-col bg-black text-white">
      {/* Info row + save button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            Day {day}: {theme}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            Canvas flips in{" "}
            <Countdown startedAt={startedAt} epochDuration={epochDuration} />
            {remaining !== null && (
              <span className="ml-2">Brush: {remaining.toString()}</span>
            )}
          </div>
        </div>
        <Button
          onClick={() => onSave()}
          size="sm"
          className="shrink-0 gap-1.5"
        >
          <ArrowUpCircle />
          Save
        </Button>
      </div>

      {/* Tool buttons — scrolls on mobile, wraps on desktop */}
      <div className="flex items-center justify-start sm:justify-center gap-1 px-3 py-1 overflow-x-auto sm:flex-wrap">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "undo" })}
          disabled={!canUndo}
          className="text-white hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "redo" })}
          disabled={!canRedo}
          className="text-white hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Redo (Ctrl+Shift+Z)"
        >
          <RedoIcon />
        </Button>

        <div className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "toggle-grid" })}
          className={
            showGrid
              ? "text-white bg-white/20 hover:text-white hover:bg-white/30"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }
          title="Toggle Grid"
        >
          <GridIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onTogglePan}
          className={
            isPanning
              ? "text-white bg-white/20 hover:text-white hover:bg-white/30"
              : "text-white hover:text-white hover:bg-white/10"
          }
          title="Pan Canvas"
        >
          <HandIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "zoom-in" })}
          className="text-white hover:text-white hover:bg-white/10"
          title="Zoom In"
        >
          <MagnifyingGlassPlus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "zoom-out" })}
          className="text-white hover:text-white hover:bg-white/10"
          title="Zoom Out"
        >
          <MagnifyingGlassMinus />
        </Button>

        <div className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />

        {/* BG opacity */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-white/50">BG</span>
          <input
            type="range"
            min={0}
            max={100}
            value={backgroundOpacity}
            onChange={(e) => onBackgroundOpacityChange(Number(e.target.value))}
            className="w-14 h-1 accent-white cursor-pointer"
            title={`Background: ${backgroundOpacity}%`}
          />
        </div>

        <div className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch({ type: "reset" })}
          className="text-white hover:text-white hover:bg-white/10"
          title="Clear Canvas"
        >
          <Trash />
        </Button>
      </div>

      {/* Palette row */}
      <div className="flex items-center justify-start sm:justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 pb-2 overflow-x-auto">
        {palette.map((color, index) => (
          <button
            key={index}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-sm cursor-pointer border-2 shrink-0"
            style={{
              backgroundColor: palette[index],
              borderColor: index === colorIndex ? "white" : "transparent",
            }}
            onClick={() => dispatch({ type: "pick", index })}
          />
        ))}
      </div>
    </div>
  );
}
