"use client";

import { useState } from "react";
import {
  PencilIcon,
  EraserIcon,
  BucketIcon,
  RectangleIcon,
  EllipseIcon,
  MoveArtIcon,
  CopyIcon,
  PlayIcon,
} from "@/components/icons";
import type { Tool, ShapeType } from "./canvas-reducer";
import type { Frame } from "./frame-manager";
import { copyStrokesToClipboard, pasteStrokesFromClipboard } from "@/lib/copy-strokes";
import { Button } from "@/components/ui/button";
import Pixels from "@/lib/pixels";

const mainTools: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: "pencil", icon: <PencilIcon />, label: "Pencil" },
  { id: "eraser", icon: <EraserIcon />, label: "Eraser" },
  { id: "bucket", icon: <BucketIcon />, label: "Fill" },
  { id: "shape", icon: <RectangleIcon />, label: "Shape" },
  { id: "move-art", icon: <MoveArtIcon />, label: "Move" },
];

const shapes: { id: ShapeType; icon: React.ReactNode; label: string }[] = [
  { id: "rectangle", icon: <RectangleIcon />, label: "Rect" },
  { id: "ellipse", icon: <EllipseIcon />, label: "Ellipse" },
];

export default function ToolSidebar({
  activeTool,
  onToolChange,
  shapeType,
  onShapeChange,
  brushSize,
  onBrushSizeChange,
  animationEnabled,
  onAnimationToggle,
  frames,
  activeFrameIndex,
  onSwitchFrame,
  onAddFrame,
  onDeleteFrame,
  onPreviewAnimation,
  onPaste,
  pixels,
}: {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  shapeType: ShapeType;
  onShapeChange: (shape: ShapeType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  animationEnabled: boolean;
  onAnimationToggle: () => void;
  frames: Frame[];
  activeFrameIndex: number;
  onSwitchFrame: (index: number) => void;
  onAddFrame: () => void;
  onDeleteFrame: (index: number) => void;
  onPreviewAnimation: () => void;
  onPaste: (pixels: import("@/lib/pixels").default) => void;
  pixels: Pixels;
}) {
  const [showShapes, setShowShapes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState(false);

  const showBrushSize = activeTool === "pencil" || activeTool === "eraser";
  const showShapePicker = activeTool === "shape" && showShapes;
  const hasPopup = showBrushSize || showShapePicker || animationEnabled;

  async function handleCopy() {
    const ok = await copyStrokesToClipboard(pixels);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handlePaste() {
    const p = await pasteStrokesFromClipboard();
    if (p) {
      onPaste(p);
      setPasted(true);
      setTimeout(() => setPasted(false), 2000);
    }
  }

  return (
    <div className="relative">
      {/* Floating popup above — pointer-events pass through to canvas */}
      {hasPopup && (
        <div className="absolute bottom-full left-0 right-0 flex flex-col items-center gap-1 pb-1 pointer-events-none">
          {/* Frame strip */}
          {animationEnabled && (
            <div className="flex items-center gap-2 px-3 py-2 pointer-events-auto bg-black/90 rounded-md mx-3 w-auto max-w-full overflow-x-auto">
              {frames.map((frame, index) => (
                <div key={frame.id} className="relative shrink-0 group">
                  <button
                    onClick={() => onSwitchFrame(index)}
                    className={`flex flex-col items-center justify-center w-11 h-11 rounded-md border-2 transition-colors cursor-pointer ${
                      index === activeFrameIndex
                        ? "border-white text-white bg-white/10"
                        : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"
                    }`}
                    title={frame.label}
                  >
                    <span className="text-xs font-bold">{index + 1}</span>
                    <span className="text-[8px] text-white/40 tabular-nums">
                      {frame.pixels.storage.size}px
                    </span>
                  </button>
                  {frames.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => onDeleteFrame(index)}
                      className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete frame"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <button
                onClick={onAddFrame}
                className="flex items-center justify-center shrink-0 w-11 h-11 rounded-md border-2 border-dashed border-white/20 text-white/40 hover:border-white/50 hover:text-white transition-colors cursor-pointer"
                title="Add frame"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              {frames.length > 1 && (
                <button
                  onClick={onPreviewAnimation}
                  className="flex flex-col items-center justify-center shrink-0 w-11 h-11 rounded-md border-2 border-white/20 text-white/50 hover:border-white/50 hover:text-white transition-colors cursor-pointer gap-0.5"
                  title="Preview animation"
                >
                  <span className="size-4"><PlayIcon /></span>
                  <span className="text-[8px]">Play</span>
                </button>
              )}
            </div>
          )}

          {/* Shape picker */}
          {showShapePicker && (
            <div className="flex items-center gap-1 pointer-events-auto bg-black/90 rounded-md px-2 py-1">
              {shapes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onShapeChange(shape.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-md p-2 min-w-[3rem] transition-colors cursor-pointer ${
                    shapeType === shape.id
                      ? "bg-white/20 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="size-4">{shape.icon}</span>
                  <span className="text-[9px] leading-tight">{shape.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Brush size */}
          {showBrushSize && (
            <div className="flex items-center gap-2 pointer-events-auto bg-black/90 rounded-md px-3 py-2">
              <span className="text-[10px] text-white/50">Size</span>
              <input
                type="range"
                min={1}
                max={10}
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                className="w-24 h-1 accent-white cursor-pointer"
                title={`Brush size: ${brushSize}`}
              />
              <span className="text-[10px] text-white/50 tabular-nums">{brushSize}px</span>
            </div>
          )}
        </div>
      )}

      {/* Main tool row */}
      <div className="flex items-center justify-center gap-1 p-2 bg-black overflow-x-auto">
        {mainTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              onToolChange(tool.id);
              if (tool.id === "shape") {
                setShowShapes((v) => !v);
              } else {
                setShowShapes(false);
              }
            }}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-md p-2 min-w-[2.5rem] sm:min-w-[3.5rem] transition-colors cursor-pointer shrink-0 ${
              activeTool === tool.id
                ? "bg-primary text-primary-foreground"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title={tool.label}
          >
            <span className="size-5">{tool.icon}</span>
            <span className="text-[10px] leading-tight font-medium hidden sm:block">{tool.label}</span>
          </button>
        ))}

        <div className="w-px h-8 bg-white/20 mx-1 shrink-0" />

        {/* Copy stroke */}
        <button
          onClick={handleCopy}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-md p-2 min-w-[2.5rem] sm:min-w-[3.5rem] transition-colors cursor-pointer shrink-0 ${
            copied
              ? "bg-green-700 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Copy stroke code to clipboard"
        >
          <span className="size-5"><CopyIcon /></span>
          <span className="text-[10px] leading-tight font-medium hidden sm:block">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>

        {/* Paste stroke */}
        <button
          onClick={handlePaste}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-md p-2 min-w-[2.5rem] sm:min-w-[3.5rem] transition-colors cursor-pointer shrink-0 ${
            pasted
              ? "bg-green-700 text-white"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Paste stroke code from clipboard"
        >
          <span className="size-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </span>
          <span className="text-[10px] leading-tight font-medium hidden sm:block">
            {pasted ? "Pasted!" : "Paste"}
          </span>
        </button>

        {/* Animation toggle */}
        <button
          onClick={onAnimationToggle}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-md p-2 min-w-[2.5rem] sm:min-w-[3.5rem] transition-colors cursor-pointer shrink-0 ${
            animationEnabled
              ? "bg-primary text-primary-foreground"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title={animationEnabled ? "Animation on — click to disable" : "Animation off — click to enable"}
        >
          <span className="size-5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m-21 1.5v1.5" />
            </svg>
          </span>
          <span className="text-[10px] leading-tight font-medium hidden sm:block">Frames</span>
        </button>
      </div>
    </div>
  );
}
