"use client";

import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Pixels from "@/lib/pixels";
import { usePromise } from "@/lib/use-promise";
import { BASEPAINT_ADDRESS, BRUSH_ADDRESS } from "@/lib/constants";
import { parseAbi } from "viem";
import type { Address } from "viem";
import { getSecondsLeft } from "@/components/countdown";
import type { Client } from "@/features/wallet/use-client";
import Toolbar from "./toolbar";
import ToolSidebar from "./tool-sidebar";
import { reducer, initialState, RULES } from "./canvas-reducer";
import { useFrames, STORAGE_KEY } from "./use-frames";
import AnimationPreview from "./animation-preview";
import { pasteStrokesFromClipboard } from "@/lib/copy-strokes";

function Canvas({
  client,
  day,
  epochDuration,
  startedAt,
  theme,
  palette,
  size,
  pixels,
  address,
  brushes,
}: {
  client: Client;
  day: number;
  epochDuration: bigint;
  startedAt: bigint;
  theme: string;
  palette: string[];
  size: number;
  pixels: string;
  address: Address;
  brushes: { id: bigint; strength: bigint }[];
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    // Initialize canvas with the active frame's saved pixels
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data.frames) && data.frames.length > 0) {
          const idx = Math.min(data.activeFrameIndex ?? 0, data.frames.length - 1);
          const pixels = Pixels.fromString(data.frames[idx]?.pixels ?? "");
          return { ...initialState, pixels };
        }
      }
    } catch {}
    return initialState;
  });
  const [isPanning, setIsPanning] = useState(false);
  const [showAnimationPreview, setShowAnimationPreview] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) return JSON.parse(raw).animationEnabled ?? false;
    } catch {}
    return false;
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);
  const panActiveRef = useRef(false);
  const isSwitchingFrameRef = useRef(false);
  const PIXEL_SIZE = state.pixelSize;

  const background = useMemo(() => Pixels.fromString(pixels), [pixels]);

  // Pre-render background to offscreen canvas (once per background/palette/zoom change)
  const bgCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const bgCacheKeyRef = useRef("");
  useMemo(() => {
    const key = `${pixels}:${palette.join(",")}:${state.pixelSize}:${size}`;
    if (key === bgCacheKeyRef.current) return;
    bgCacheKeyRef.current = key;
    const PS = state.pixelSize;
    const bg = bgCanvasRef.current;
    bg.width = size * PS;
    bg.height = size * PS;
    const ctx = bg.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, size * PS, size * PS);
    for (const { x, y, color } of background) {
      if (palette[color]) {
        ctx.fillStyle = palette[color];
        ctx.fillRect(x * PS, y * PS, PS, PS);
      }
    }
  }, [background, palette, state.pixelSize, size, pixels]);

  // Pre-render grid to offscreen canvas
  const gridCanvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const gridCacheKeyRef = useRef("");
  useMemo(() => {
    const key = `${state.pixelSize}:${size}`;
    if (key === gridCacheKeyRef.current) return;
    gridCacheKeyRef.current = key;
    const PS = state.pixelSize;
    const gc = gridCanvasRef.current;
    gc.width = size * PS;
    gc.height = size * PS;
    const ctx = gc.getContext("2d")!;
    ctx.clearRect(0, 0, gc.width, gc.height);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x++) {
      ctx.moveTo(x * PS, 0);
      ctx.lineTo(x * PS, size * PS);
    }
    for (let y = 0; y <= size; y++) {
      ctx.moveTo(0, y * PS);
      ctx.lineTo(size * PS, y * PS);
    }
    ctx.stroke();
  }, [state.pixelSize, size]);

  // Frame manager
  const { frameState, frameDispatch, activeFrame } = useFrames();

  // Sync canvas pixels → active frame (debounced — skip during frame switch)
  const frameSyncTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (isSwitchingFrameRef.current) return;
    clearTimeout(frameSyncTimerRef.current);
    frameSyncTimerRef.current = setTimeout(() => {
      frameDispatch({
        type: "update-frame-pixels",
        index: frameState.activeFrameIndex,
        pixels: state.pixels,
      });
    }, 100);
    return () => clearTimeout(frameSyncTimerRef.current);
  }, [state.pixels]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist frames + animationEnabled to localStorage (debounced)
  const storageTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(storageTimerRef.current);
    storageTimerRef.current = setTimeout(() => {
      try {
        const data = {
          frames: frameState.frames.map((f) => ({
            id: f.id,
            label: f.label,
            pixels: f.pixels.toString(),
          })),
          activeFrameIndex: frameState.activeFrameIndex,
          animationEnabled,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    }, 500);
    return () => clearTimeout(storageTimerRef.current);
  }, [frameState, animationEnabled]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        // Only intercept if focus is not in a text input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        pasteStrokesFromClipboard().then((pixels) => {
          if (pixels) dispatch({ type: "load-pixels", pixels });
        });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    panActiveRef.current = isPanning;
  }, [isPanning]);

  const bestBrush = brushes[0] ?? null;

  const brushUsedOnChain = usePromise(
    () => {
      if (!bestBrush) return Promise.resolve(0n);
      return client.readContract({
        abi: parseAbi(["function brushUsed(uint256, uint256) view returns (uint256)"]),
        functionName: "brushUsed",
        address: BASEPAINT_ADDRESS,
        args: [BigInt(day), bestBrush.id],
      });
    },
    [day, bestBrush?.id]
  );

  // Total pixels across all frames
  const totalPixelCount = frameState.frames.reduce(
    (sum, f) => sum + f.pixels.storage.size,
    0
  );

  const remaining = bestBrush
    ? bestBrush.strength - (brushUsedOnChain ?? 0n) - BigInt(totalPixelCount)
    : null;

  // Switch to a different frame
  const handleSwitchFrame = useCallback(
    (index: number) => {
      // Save current pixels to current frame
      frameDispatch({
        type: "update-frame-pixels",
        index: frameState.activeFrameIndex,
        pixels: state.pixels,
      });
      // Load new frame
      isSwitchingFrameRef.current = true;
      frameDispatch({ type: "switch-frame", index });
      const newPixels = frameState.frames[index]?.pixels ?? new Pixels();
      dispatch({ type: "load-pixels", pixels: newPixels });
      // Allow sync again after this render
      requestAnimationFrame(() => {
        isSwitchingFrameRef.current = false;
      });
    },
    [frameState, state.pixels, frameDispatch]
  );

  const handleAddFrame = useCallback(() => {
    // Save current pixels first
    frameDispatch({
      type: "update-frame-pixels",
      index: frameState.activeFrameIndex,
      pixels: state.pixels,
    });
    frameDispatch({ type: "add-frame" });
    // Load empty pixels for the new frame
    isSwitchingFrameRef.current = true;
    dispatch({ type: "load-pixels", pixels: new Pixels() });
    requestAnimationFrame(() => {
      isSwitchingFrameRef.current = false;
    });
  }, [frameState, state.pixels, frameDispatch]);

  const handleDeleteFrame = useCallback(
    (index: number) => {
      if (frameState.frames.length <= 1) return;
      const newActiveIndex = Math.max(
        0,
        index <= frameState.activeFrameIndex
          ? frameState.activeFrameIndex - 1
          : frameState.activeFrameIndex
      );
      frameDispatch({ type: "delete-frame", index });
      // Load the new active frame's pixels
      const targetIndex =
        index < frameState.frames.length - 1 ? index : index - 1;
      const newPixels = frameState.frames[targetIndex]?.pixels ?? new Pixels();
      isSwitchingFrameRef.current = true;
      dispatch({ type: "load-pixels", pixels: newPixels });
      requestAnimationFrame(() => {
        isSwitchingFrameRef.current = false;
      });
      void newActiveIndex; // suppress unused warning
    },
    [frameState, frameDispatch]
  );

  async function save() {
    if (!bestBrush) {
      alert("You don't own any brushes.");
      return;
    }

    const chainId = await client.getChainId();
    if (chainId !== client.chain.id) {
      await client.switchChain(client.chain);
    }

    const agreedToRules = confirm(RULES);
    if (!agreedToRules) return;

    const brushId = bestBrush.id;

    const owner = await client.readContract({
      account: address,
      abi: parseAbi(["function ownerOf(uint256) returns (address)"]),
      functionName: "ownerOf",
      address: BRUSH_ADDRESS,
      args: [brushId],
    });

    if (owner !== address) {
      alert("You do not own this brush, the owner is " + owner);
      return;
    }

    const strength = bestBrush.strength;

    const secondsToFinalize = 30 * 60;
    const secondsLeft = getSecondsLeft({
      timestamp: BigInt(Date.now()) / 1000n,
      startedAt,
      epochDuration,
    });

    if (strength < 100_000n && secondsLeft < secondsToFinalize) {
      alert(
        `The last ${secondsToFinalize} seconds are for cleanup crew only.`
      );
      return;
    }

    // Save current canvas pixels to active frame first
    const updatedFrames = frameState.frames.map((f, i) =>
      i === frameState.activeFrameIndex ? { ...f, pixels: state.pixels } : f
    );

    // 1-pixel spacer: repaint (0,0) with color 0 (base palette color — no visual change)
    const spacerHex = "000000";

    const paint = async (hex: string) => {
      await client.writeContract({
        account: address,
        abi: parseAbi([
          "function paint(uint256 day, uint256 tokenId, bytes calldata pixels)",
        ]),
        functionName: "paint",
        address: BASEPAINT_ADDRESS,
        args: [BigInt(day), brushId, `0x${hex}`],
      });
    };

    try {
      if (!animationEnabled) {
        // Single frame — just submit the active frame
        const frameHex = updatedFrames[frameState.activeFrameIndex]?.pixels.toString() ?? "";
        if (frameHex) await paint(frameHex);
      } else {
        for (let i = 0; i < updatedFrames.length; i++) {
          const frameHex = updatedFrames[i].pixels.toString();
          if (!frameHex) continue; // skip empty frames

          await paint(frameHex);

          // Submit 1-pixel spacer between frames (not after the last one)
          if (i < updatedFrames.length - 1) {
            await paint(spacerHex);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("user rejected") && !msg.toLowerCase().includes("user denied")) {
        alert("Transaction failed: " + msg);
      }
    }
  }

  // Canvas rendering — coalesce with requestAnimationFrame
  const rafRef = useRef<number>(undefined);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, size * PIXEL_SIZE, size * PIXEL_SIZE);
      ctx.imageSmoothingEnabled = false;

      // White base so lowering BG opacity fades to white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size * PIXEL_SIZE, size * PIXEL_SIZE);

      const bgOpacity = (state.backgroundOpacity ?? 100) / 100;
      ctx.globalAlpha = bgOpacity;
      // Draw pre-rendered background in one call instead of iterating all pixels
      ctx.drawImage(bgCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;

      if (state.showGrid) {
        ctx.drawImage(gridCanvasRef.current, 0, 0);
      }

      for (const { x, y, color } of state.pixels) {
        if (palette[color]) {
          ctx.fillStyle = palette[color];
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      }

      // Shape preview overlay
      if (state.rectStart && state.rectPreview) {
        const minX = Math.min(state.rectStart.x, state.rectPreview.x);
        const maxX = Math.max(state.rectStart.x, state.rectPreview.x);
        const minY = Math.min(state.rectStart.y, state.rectPreview.y);
        const maxY = Math.max(state.rectStart.y, state.rectPreview.y);

        ctx.fillStyle = palette[state.colorIndex] + "80";

        if ((state.shapeType ?? "rectangle") === "ellipse") {
          const cx = ((minX + maxX + 1) / 2) * PIXEL_SIZE;
          const cy = ((minY + maxY + 1) / 2) * PIXEL_SIZE;
          const rx = ((maxX - minX + 1) / 2) * PIXEL_SIZE;
          const ry = ((maxY - minY + 1) / 2) * PIXEL_SIZE;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(
            minX * PIXEL_SIZE,
            minY * PIXEL_SIZE,
            (maxX - minX + 1) * PIXEL_SIZE,
            (maxY - minY + 1) * PIXEL_SIZE
          );
        }
      }
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, PIXEL_SIZE, size, state.pixels, state.drawTick, state.rectStart, state.rectPreview, state.colorIndex, state.showGrid, state.shapeType, state.backgroundOpacity]);

  const locate = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasSize = rect.width;
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      const actualPixelSize = canvasSize / size;
      const x = Math.floor((clientX - rect.left) / actualPixelSize);
      const y = Math.floor((clientY - rect.top) / actualPixelSize);
      return { x: Math.max(0, Math.min(x, size - 1)), y: Math.max(0, Math.min(y, size - 1)) };
    },
    [size]
  );

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (panActiveRef.current) {
        const pos = getClientPos(e);
        const el = scrollRef.current;
        if (el) {
          panStartRef.current = { x: pos.x, y: pos.y, scrollX: el.scrollLeft, scrollY: el.scrollTop };
        }
        return;
      }

      if (state.activeTool === "bucket") {
        dispatch({ type: "flood-fill", where: locate(e), background });
        return;
      }

      dispatch({ type: "down", where: locate(e) });
    },
    [state.activeTool, locate, background]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (panActiveRef.current && panStartRef.current) {
        const pos = getClientPos(e);
        const el = scrollRef.current;
        if (el) {
          el.scrollLeft = panStartRef.current.scrollX - (pos.x - panStartRef.current.x);
          el.scrollTop = panStartRef.current.scrollY - (pos.y - panStartRef.current.y);
        }
        return;
      }

      dispatch({ type: "move", where: locate(e) });
    },
    [locate]
  );

  const handlePointerUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (panActiveRef.current) {
        panStartRef.current = null;
        return;
      }

      if (state.activeTool === "shape" && "clientX" in e) {
        dispatch({ type: "up", where: locate(e) });
        return;
      }

      dispatch({ type: "up" });
    },
    [state.activeTool, locate]
  );

  const cursorClass = isPanning
    ? panStartRef.current ? "cursor-grabbing" : "cursor-grab"
    : state.activeTool === "move-art"
    ? "cursor-move"
    : "cursor-crosshair";

  const isDrawTool = ["pencil", "eraser", "shape", "bucket", "move-art"].includes(state.activeTool);
  const touchAction = isPanning ? "none" : isDrawTool ? "none" : "auto";

  return (
    <div className="flex flex-col flex-1 h-screen">
      <Toolbar
        day={day}
        startedAt={startedAt}
        epochDuration={epochDuration}
        theme={theme}
        colorIndex={state.colorIndex}
        palette={palette}
        dispatch={dispatch}
        onSave={save}
        remaining={remaining}
        canUndo={(state.history ?? []).length > 0}
        canRedo={(state.future ?? []).length > 0}
        showGrid={state.showGrid ?? true}
        isPanning={isPanning}
        onTogglePan={() => setIsPanning((v) => !v)}
        backgroundOpacity={state.backgroundOpacity ?? 100}
        onBackgroundOpacityChange={(v) => dispatch({ type: "set-background-opacity", opacity: v })}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto flex items-start justify-center"
        >
          <canvas
            ref={canvasRef}
            className={cursorClass}
            onTouchStart={(e) => {
              e.preventDefault();
              handlePointerDown(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              handlePointerMove(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handlePointerUp(e);
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={() => {
              panStartRef.current = null;
              dispatch({ type: "leave" });
            }}
            onContextMenu={(e) => e.preventDefault()}
            width={size * PIXEL_SIZE}
            height={size * PIXEL_SIZE}
            style={{ touchAction }}
          />
        </div>
        <ToolSidebar
          activeTool={state.activeTool}
          onToolChange={(tool) => dispatch({ type: "set-tool", tool })}
          shapeType={state.shapeType ?? "rectangle"}
          onShapeChange={(shape) => dispatch({ type: "set-shape", shape })}
          brushSize={state.brushSize ?? 1}
          onBrushSizeChange={(s) => dispatch({ type: "set-brush-size", size: s })}
          animationEnabled={animationEnabled}
          onAnimationToggle={() => setAnimationEnabled((v: boolean) => !v)}
          frames={frameState.frames}
          activeFrameIndex={frameState.activeFrameIndex}
          onSwitchFrame={handleSwitchFrame}
          onAddFrame={handleAddFrame}
          onDeleteFrame={handleDeleteFrame}
          onPreviewAnimation={() => setShowAnimationPreview(true)}
          onPaste={(p) => dispatch({ type: "load-pixels", pixels: p })}
          pixels={state.pixels}
          background={background}
        />
      </div>

      {showAnimationPreview && (
        <AnimationPreview
          frames={frameState.frames.map((f, i) =>
            i === frameState.activeFrameIndex ? { ...f, pixels: state.pixels } : f
          )}
          palette={palette}
          size={size}
          background={background}
          onClose={() => setShowAnimationPreview(false)}
        />
      )}
    </div>
  );
}

export default memo(Canvas);
