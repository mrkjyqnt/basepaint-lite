"use client";

import { useEffect, useRef, useState } from "react";
import type { Frame } from "./frame-manager";
import Pixels from "@/lib/pixels";
import { PlayIcon, PauseIcon } from "@/components/icons";

const PREVIEW_PIXEL_SIZE = 2;

function renderFrame(
  ctx: CanvasRenderingContext2D,
  frames: Frame[],
  frameIndex: number,
  background: Pixels,
  palette: string[],
  size: number
) {
  const ps = PREVIEW_PIXEL_SIZE;
  ctx.clearRect(0, 0, size * ps, size * ps);

  // White base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size * ps, size * ps);

  // Background (palette base color)
  ctx.fillStyle = palette[0] ?? "#000";
  ctx.fillRect(0, 0, size * ps, size * ps);

  // Background pixels
  for (const { x, y, color } of background) {
    if (palette[color]) {
      ctx.fillStyle = palette[color];
      ctx.fillRect(x * ps, y * ps, ps, ps);
    }
  }

  // Cumulative frames 0..frameIndex
  for (let i = 0; i <= frameIndex; i++) {
    for (const { x, y, color } of frames[i].pixels) {
      if (palette[color]) {
        ctx.fillStyle = palette[color];
        ctx.fillRect(x * ps, y * ps, ps, ps);
      }
    }
  }
}

export default function AnimationPreview({
  frames,
  palette,
  size,
  background,
  onClose,
}: {
  frames: Frame[];
  palette: string[];
  size: number;
  background: Pixels;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Draw current frame
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    renderFrame(ctx, frames, currentIndex, background, palette, size);
  }, [currentIndex, frames, background, palette, size]);

  // Advance frames when playing
  useEffect(() => {
    if (!isPlaying) return;
    const frame = frames[currentIndex];
    const duration = Math.max(100, frame.pixels.storage.size); // 1px = 1ms, min 100ms
    const timer = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % frames.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, frames]);

  const ps = PREVIEW_PIXEL_SIZE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-3 p-4 bg-black rounded-xl border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview canvas */}
        <canvas
          ref={canvasRef}
          width={size * ps}
          height={size * ps}
          className="rounded"
          style={{
            imageRendering: "pixelated",
            maxWidth: "min(80vw, 80vh)",
            maxHeight: "min(80vw, 80vh)",
            width: size * ps,
            height: size * ps,
          }}
        />

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((v) => !v)}
            className="flex items-center justify-center size-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <span className="size-4"><PauseIcon /></span>
            ) : (
              <span className="size-4"><PlayIcon /></span>
            )}
          </button>
          <span className="text-xs text-white/60 tabular-nums">
            Frame {currentIndex + 1} / {frames.length}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
