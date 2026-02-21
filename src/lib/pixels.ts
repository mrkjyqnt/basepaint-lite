type FlatPoint = number;
type Point2D = { x: number; y: number };

function flatPoint({ x, y }: Point2D) {
  return x + y * 10_000;
}

function point2D(n: FlatPoint): Point2D {
  return { x: n % 10_000, y: Math.floor(n / 10_000) };
}

function toPaddedHex(n: number) {
  return n.toString(16).padStart(2, "0");
}

export default class Pixels {
  storage: Map<FlatPoint, number>;

  constructor(data?: Map<FlatPoint, number>) {
    this.storage = data || new Map();
  }

  get(x: number, y: number): number | undefined {
    return this.storage.get(flatPoint({ x, y }));
  }

  set(x: number, y: number, color: number | null) {
    const map = new Map(this.storage);
    if (color === null) {
      map.delete(flatPoint({ x, y }));
    } else {
      map.set(flatPoint({ x, y }), color);
    }
    return new Pixels(map);
  }

  setMany(entries: [number, number, number | null][]): Pixels {
    const map = new Map(this.storage);
    for (const [x, y, color] of entries) {
      if (color === null) {
        map.delete(flatPoint({ x, y }));
      } else {
        map.set(flatPoint({ x, y }), color);
      }
    }
    return new Pixels(map);
  }

  /** Mutate in place — O(entries) instead of O(totalPixels). Returns same instance. */
  mutateMany(entries: [number, number, number | null][]): this {
    for (const [x, y, color] of entries) {
      if (color === null) {
        this.storage.delete(flatPoint({ x, y }));
      } else {
        this.storage.set(flatPoint({ x, y }), color);
      }
    }
    return this;
  }

  *[Symbol.iterator]() {
    for (const [flat, color] of this.storage) {
      const { x, y } = point2D(flat);
      yield { x, y, color };
    }
  }

  toString() {
    let result = "";
    for (const { x, y, color } of this) {
      result += toPaddedHex(x) + toPaddedHex(y) + toPaddedHex(color);
    }
    return result;
  }

  translate(dx: number, dy: number, size: number): Pixels {
    const map = new Map<FlatPoint, number>();
    for (const [flat, color] of this.storage) {
      const { x, y } = point2D(flat);
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        map.set(flatPoint({ x: nx, y: ny }), color);
      }
    }
    return new Pixels(map);
  }

  static fromString(data: string) {
    const map = new Map();
    for (const [pixel] of data.matchAll(/.{6}/g)) {
      const [x, y, color] = [...pixel.matchAll(/.{2}/g)].map(([n]) =>
        parseInt(n, 16)
      );
      map.set(flatPoint({ x, y }), color);
    }

    return new Pixels(map);
  }
}
