import Pixels from "@/lib/pixels";

export type Frame = {
  id: string;
  pixels: Pixels;
  label: string;
};

export type FrameManagerState = {
  frames: Frame[];
  activeFrameIndex: number;
};

export type FrameAction =
  | { type: "add-frame" }
  | { type: "delete-frame"; index: number }
  | { type: "switch-frame"; index: number }
  | { type: "duplicate-frame"; index: number }
  | { type: "update-frame-pixels"; index: number; pixels: Pixels };

function makeFrame(label: string): Frame {
  return { id: crypto.randomUUID(), pixels: new Pixels(), label };
}

export function createInitialFrameState(): FrameManagerState {
  return {
    frames: [makeFrame("Frame 1")],
    activeFrameIndex: 0,
  };
}

export function frameReducer(
  state: FrameManagerState,
  action: FrameAction
): FrameManagerState {
  switch (action.type) {
    case "add-frame": {
      const label = `Frame ${state.frames.length + 1}`;
      const newFrame = makeFrame(label);
      return {
        frames: [...state.frames, newFrame],
        activeFrameIndex: state.frames.length,
      };
    }

    case "delete-frame": {
      if (state.frames.length <= 1) return state;
      const frames = state.frames.filter((_, i) => i !== action.index);
      const activeFrameIndex = Math.min(
        state.activeFrameIndex,
        frames.length - 1
      );
      return { frames, activeFrameIndex };
    }

    case "switch-frame": {
      const index = Math.max(0, Math.min(action.index, state.frames.length - 1));
      return { ...state, activeFrameIndex: index };
    }

    case "duplicate-frame": {
      const src = state.frames[action.index];
      if (!src) return state;
      const copy: Frame = {
        id: crypto.randomUUID(),
        pixels: src.pixels,
        label: `${src.label} (copy)`,
      };
      const frames = [
        ...state.frames.slice(0, action.index + 1),
        copy,
        ...state.frames.slice(action.index + 1),
      ];
      return { frames, activeFrameIndex: action.index + 1 };
    }

    case "update-frame-pixels": {
      const frames = state.frames.map((f, i) =>
        i === action.index ? { ...f, pixels: action.pixels } : f
      );
      return { ...state, frames };
    }

    default:
      return state;
  }
}
