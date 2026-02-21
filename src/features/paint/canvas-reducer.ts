import Pixels from "@/lib/pixels";

export type Point2D = { x: number; y: number };

export type ShapeType = "rectangle" | "ellipse";

export type Tool = "pencil" | "eraser" | "bucket" | "shape" | "move-art";

export type State = {
  size: number;
  down: boolean;
  pixelSize: number;
  colorIndex: number;
  pixels: Pixels;
  activeTool: Tool;
  shapeType: ShapeType;
  brushSize: number;
  rectStart: Point2D | null;
  rectPreview: Point2D | null;
  moveStart: Point2D | null;
  showGrid: boolean;
  opacity: number;
  backgroundOpacity: number;
  history: Pixels[];
  future: Pixels[];
  lastPainted: Point2D | null;
  drawTick: number;
};

export const initialState: State = {
  size: 256,
  down: false,
  pixelSize: 3,
  colorIndex: 0,
  pixels: new Pixels(),
  activeTool: "pencil",
  shapeType: "rectangle",
  brushSize: 1,
  rectStart: null,
  rectPreview: null,
  moveStart: null,
  showGrid: true,
  opacity: 100,
  backgroundOpacity: 100,
  history: [],
  future: [],
  lastPainted: null,
  drawTick: 0,
};

export type Action =
  | { type: "init"; size: number }
  | { type: "pick"; index: number }
  | { type: "set-tool"; tool: Tool }
  | { type: "set-shape"; shape: ShapeType }
  | { type: "set-brush-size"; size: number }
  | { type: "down"; where: Point2D }
  | { type: "move"; where: Point2D }
  | { type: "up"; where?: Point2D }
  | { type: "leave" }
  | { type: "zoom-in" }
  | { type: "zoom-out" }
  | { type: "reset" }
  | { type: "flood-fill"; where: Point2D; background: Pixels }
  | { type: "toggle-grid" }
  | { type: "set-opacity"; opacity: number }
  | { type: "set-background-opacity"; opacity: number }
  | { type: "load-pixels"; pixels: Pixels }
  | { type: "undo" }
  | { type: "redo" };

function inBounds(p: Point2D, size: number) {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}

function brushPixels(
  cx: number,
  cy: number,
  brushSize: number,
  color: number | null,
  canvasSize: number
): [number, number, number | null][] {
  const entries: [number, number, number | null][] = [];
  if (brushSize <= 1) {
    entries.push([cx, cy, color]);
  } else {
    const r = brushSize / 2;
    const rSq = r * r;
    const offset = Math.ceil(r);
    for (let dx = -offset; dx <= offset; dx++) {
      for (let dy = -offset; dy <= offset; dy++) {
        if (dx * dx + dy * dy <= rSq) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < canvasSize && ny >= 0 && ny < canvasSize) {
            entries.push([nx, ny, color]);
          }
        }
      }
    }
  }
  return entries;
}

function floodFill(
  pixels: Pixels,
  _background: Pixels,
  x: number,
  y: number,
  fillColor: number,
  size: number
): Pixels {
  const targetColor = pixels.get(x, y) ?? -1;

  if (targetColor === fillColor) return pixels;

  const queue: [number, number][] = [[x, y]];
  const visited = new Set<string>();
  const entries: [number, number, number][] = [];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    const key = `${cx},${cy}`;

    if (visited.has(key)) continue;
    if (cx < 0 || cx >= size || cy < 0 || cy >= size) continue;

    const currentColor = pixels.get(cx, cy) ?? -1;
    if (currentColor !== targetColor) continue;

    visited.add(key);
    entries.push([cx, cy, fillColor]);

    queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  return pixels.setMany(entries);
}

function rectPixels(
  start: Point2D,
  end: Point2D,
  color: number
): [number, number, number][] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const entries: [number, number, number][] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      entries.push([x, y, color]);
    }
  }
  return entries;
}

function ellipsePixels(
  start: Point2D,
  end: Point2D,
  color: number
): [number, number, number][] {
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.abs(end.x - start.x) / 2;
  const ry = Math.abs(end.y - start.y) / 2;
  const entries: [number, number, number][] = [];
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (rx > 0 && ry > 0) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          entries.push([x, y, color]);
        }
      } else {
        entries.push([x, y, color]);
      }
    }
  }
  return entries;
}

function shapePixels(
  shapeType: ShapeType,
  start: Point2D,
  end: Point2D,
  color: number
): [number, number, number][] {
  if (shapeType === "ellipse") return ellipsePixels(start, end, color);
  return rectPixels(start, end, color);
}

const MAX_HISTORY = 50;

function pushHistory(state: State): { history: Pixels[]; future: Pixels[] } {
  const history = [...(state.history ?? []), state.pixels];
  if (history.length > MAX_HISTORY) history.shift();
  return { history, future: [] };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "pick":
      return { ...state, colorIndex: action.index };

    case "set-tool":
      return {
        ...state,
        activeTool: action.tool,
        down: false,
        rectStart: null,
        rectPreview: null,
        moveStart: null,
      };

    case "set-shape":
      return { ...state, shapeType: action.shape };

    case "set-brush-size":
      return { ...state, brushSize: Math.max(1, Math.min(10, action.size)) };

    case "down": {
      if (!inBounds(action.where, state.size)) return state;

      if (state.activeTool === "pencil") {
        return {
          ...state,
          down: true,
          lastPainted: action.where,
          ...pushHistory(state),
          pixels: state.pixels.setMany(
            brushPixels(action.where.x, action.where.y, state.brushSize, state.colorIndex, state.size)
          ),
        };
      }

      if (state.activeTool === "eraser") {
        return {
          ...state,
          down: true,
          lastPainted: action.where,
          ...pushHistory(state),
          pixels: state.pixels.setMany(
            brushPixels(action.where.x, action.where.y, state.brushSize, null, state.size)
          ),
        };
      }

      if (state.activeTool === "shape") {
        return {
          ...state,
          down: true,
          rectStart: action.where,
          rectPreview: action.where,
        };
      }

      if (state.activeTool === "move-art") {
        return {
          ...state,
          down: true,
          moveStart: action.where,
        };
      }

      // bucket handled by flood-fill action directly
      return state;
    }

    case "move": {
      if (!state.down) return state;
      if (!inBounds(action.where, state.size)) return state;

      if (state.activeTool === "pencil") {
        // Skip if still on the same pixel
        if (state.lastPainted && state.lastPainted.x === action.where.x && state.lastPainted.y === action.where.y) return state;
        // Mutate in place during stroke — history was already saved on "down"
        state.pixels.mutateMany(
          brushPixels(action.where.x, action.where.y, state.brushSize, state.colorIndex, state.size)
        );
        return { ...state, lastPainted: action.where, drawTick: state.drawTick + 1 };
      }

      if (state.activeTool === "eraser") {
        if (state.lastPainted && state.lastPainted.x === action.where.x && state.lastPainted.y === action.where.y) return state;
        state.pixels.mutateMany(
          brushPixels(action.where.x, action.where.y, state.brushSize, null, state.size)
        );
        return { ...state, lastPainted: action.where, drawTick: state.drawTick + 1 };
      }

      if (state.activeTool === "shape") {
        return { ...state, rectPreview: action.where };
      }

      if (state.activeTool === "move-art" && state.moveStart) {
        const dx = action.where.x - state.moveStart.x;
        const dy = action.where.y - state.moveStart.y;
        if (dx === 0 && dy === 0) return state;
        return {
          ...state,
          pixels: state.pixels.translate(dx, dy, state.size),
          moveStart: action.where,
        };
      }

      return state;
    }

    case "up": {
      if (state.activeTool === "shape" && state.rectStart && action.where) {
        const end = inBounds(action.where, state.size)
          ? action.where
          : state.rectPreview ?? state.rectStart;
        return {
          ...state,
          down: false,
          ...pushHistory(state),
          pixels: state.pixels.setMany(
            shapePixels(state.shapeType, state.rectStart, end, state.colorIndex)
          ),
          rectStart: null,
          rectPreview: null,
        };
      }

      if (state.activeTool === "move-art" && state.moveStart) {
        return {
          ...state,
          down: false,
          moveStart: null,
        };
      }

      return {
        ...state,
        down: false,
        lastPainted: null,
        rectStart: null,
        rectPreview: null,
        moveStart: null,
      };
    }

    case "leave":
      return { ...state, down: false, lastPainted: null, rectStart: null, rectPreview: null, moveStart: null };

    case "reset":
      return { ...state, ...pushHistory(state), pixels: new Pixels() };

    case "zoom-in":
      return { ...state, pixelSize: Math.min(20, state.pixelSize + 1) };

    case "zoom-out":
      return { ...state, pixelSize: Math.max(1, state.pixelSize - 1) };

    case "flood-fill": {
      if (!inBounds(action.where, state.size)) return state;
      return {
        ...state,
        ...pushHistory(state),
        pixels: floodFill(
          state.pixels,
          action.background,
          action.where.x,
          action.where.y,
          state.colorIndex,
          state.size
        ),
      };
    }

    case "toggle-grid":
      return { ...state, showGrid: !state.showGrid };

    case "set-opacity":
      return { ...state, opacity: Math.max(10, Math.min(100, action.opacity)) };

    case "set-background-opacity":
      return { ...state, backgroundOpacity: Math.max(0, Math.min(100, action.opacity)) };

    case "load-pixels":
      return {
        ...state,
        pixels: action.pixels,
        history: [],
        future: [],
        down: false,
        rectStart: null,
        rectPreview: null,
        moveStart: null,
      };

    case "undo": {
      if ((state.history ?? []).length === 0) return state;
      const history = [...(state.history ?? [])];
      const prev = history.pop()!;
      return {
        ...state,
        pixels: prev,
        history,
        future: [state.pixels, ...(state.future ?? [])],
      };
    }

    case "redo": {
      if ((state.future ?? []).length === 0) return state;
      const future = [...(state.future ?? [])];
      const next = future.shift()!;
      return {
        ...state,
        pixels: next,
        history: [...(state.history ?? []), state.pixels],
        future,
      };
    }

    default:
      return state;
  }
}

export const RULES = `\
BasePaint Rules:

😊 Be Kind: Be patient with each other. We're all here to learn and create together.
🖌️ Be Original: Don't copy another artist's pixel artwork.
🥸 Be Yourself: One brush per painter. Use your brush invites on new artists!
🧠 Be Creative: Help others but don't trace or spam unnecessary pixels (blobs, checkers or borders).
⚠️ Keep It Clean: No QR Codes, project names, logos, offensive symbols, etc.
🎨 CC0: Your artwork on this canvas will be released under a CC0 license in the public domain.
`;
