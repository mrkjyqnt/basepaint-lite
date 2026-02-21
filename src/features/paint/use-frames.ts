"use client";

import { useReducer } from "react";
import Pixels from "@/lib/pixels";
import {
  frameReducer,
  createInitialFrameState,
  type Frame,
  type FrameAction,
  type FrameManagerState,
} from "./frame-manager";

export const STORAGE_KEY = "basepaint-lite-v1";

function loadFromStorage(): FrameManagerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.frames) || data.frames.length === 0) return null;
    return {
      frames: data.frames.map((f: { id: string; label: string; pixels: string }) => ({
        id: f.id ?? crypto.randomUUID(),
        label: f.label ?? "Frame",
        pixels: Pixels.fromString(f.pixels ?? ""),
      })),
      activeFrameIndex: Math.min(data.activeFrameIndex ?? 0, data.frames.length - 1),
    };
  } catch {
    return null;
  }
}

export function useFrames() {
  const [frameState, frameDispatch] = useReducer(
    frameReducer,
    undefined,
    () => loadFromStorage() ?? createInitialFrameState()
  );

  const activeFrame: Frame = frameState.frames[frameState.activeFrameIndex];
  const frameCount = frameState.frames.length;

  return {
    frameState,
    frameDispatch,
    activeFrame,
    frameCount,
  };
}

export type { Frame, FrameAction, FrameManagerState };
