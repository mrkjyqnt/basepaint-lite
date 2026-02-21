"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Pixels from "@/lib/pixels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther, parseAbi } from "viem";
import type { Address } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import type { Client } from "@/features/wallet/use-client";

export default function MintView({
  client,
  address,
  day,
  theme,
  palette,
  size,
  pixels,
  price,
}: {
  client: Client;
  address: Address;
  day: number;
  theme: string;
  palette: string[];
  size: number;
  pixels: string;
  price: bigint;
}) {
  const [count, setCount] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const background = useMemo(() => Pixels.fromString(pixels), [pixels]);
  const PIXEL_SIZE = 3;

  async function mint() {
    const chainId = await client.getChainId();
    if (chainId !== client.chain.id) {
      await client.switchChain(client.chain);
    }

    await client.writeContract({
      account: address,
      abi: parseAbi([
        "function mint(uint256 day, uint256 count) public payable",
      ]),
      functionName: "mint",
      address: BASEPAINT_ADDRESS,
      args: [BigInt(day), BigInt(count)],
      value: price * BigInt(count),
    });
  }

  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, size * PIXEL_SIZE, size * PIXEL_SIZE);
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, size * PIXEL_SIZE, size * PIXEL_SIZE);

    for (const { x, y, color } of background) {
      if (palette[color]) {
        ctx.fillStyle = palette[color];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [background, palette, size]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-[360px] max-w-[95vw]">
        <CardHeader>
          <CardTitle>
            Day {day}: {theme}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-0.5">
            {palette.map((color, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  backgroundColor: color,
                  width: 20,
                  height: 20,
                }}
              />
            ))}
          </div>
          <canvas
            ref={canvasRef}
            width={size * PIXEL_SIZE}
            height={size * PIXEL_SIZE}
            className="w-full rounded-md"
          />
          <div className="flex items-center justify-between gap-3">
            <Input
              type="number"
              value={count}
              min={1}
              max={10_000}
              onChange={(e) => setCount(+e.currentTarget.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatEther(price * BigInt(count))} ETH
            </span>
          </div>
          <Button onClick={mint} size="lg" className="w-full">
            Mint
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
