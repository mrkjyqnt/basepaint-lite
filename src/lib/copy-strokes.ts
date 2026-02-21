import Pixels from "@/lib/pixels";
import type { Frame } from "@/features/paint/frame-manager";

export type PixelStroke = {
  point: { x: number; y: number };
  color: number;
};

export function pixelsToStrokes(pixels: Pixels): PixelStroke[] {
  const strokes: PixelStroke[] = [];
  for (const { x, y, color } of pixels) {
    strokes.push({ point: { x, y }, color });
  }
  return strokes;
}

/**
 * Convert frames to animation strokes.
 * Frame 0 = all its pixels.
 * Frame N = only pixels that differ from frame N-1 (diff).
 */
export function framesToAnimationStrokes(frames: Frame[]): PixelStroke[][] {
  const result: PixelStroke[][] = [];
  for (let i = 0; i < frames.length; i++) {
    if (i === 0) {
      result.push(pixelsToStrokes(frames[i].pixels));
    } else {
      const prev = frames[i - 1].pixels;
      const curr = frames[i].pixels;
      const diff: PixelStroke[] = [];
      for (const { x, y, color } of curr) {
        if (prev.get(x, y) !== color) {
          diff.push({ point: { x, y }, color });
        }
      }
      result.push(diff);
    }
  }
  return result;
}

async function copyText(text: string): Promise<boolean> {
  // Prefer Clipboard API (requires secure context)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }
  // Fallback: create a temporary textarea and use execCommand
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export async function copyStrokesToClipboard(pixels: Pixels): Promise<boolean> {
  return copyText(JSON.stringify(pixelsToStrokes(pixels)));
}

export async function copyAnimationToClipboard(frames: Frame[]): Promise<boolean> {
  return copyText(JSON.stringify(framesToAnimationStrokes(frames)));
}

export async function copyHexToClipboard(pixels: Pixels): Promise<boolean> {
  return copyText(`0x${pixels.toString()}`);
}

/** Parse clipboard text as PixelStroke[] and return a Pixels object, or null if invalid. */
export async function pasteStrokesFromClipboard(): Promise<Pixels | null> {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    const entries: [number, number, number][] = [];
    for (const s of parsed) {
      if (
        typeof s?.point?.x === "number" &&
        typeof s?.point?.y === "number" &&
        typeof s?.color === "number"
      ) {
        entries.push([s.point.x, s.point.y, s.color]);
      }
    }
    if (entries.length === 0) return null;
    return new Pixels().setMany(entries);
  } catch {
    return null;
  }
}
