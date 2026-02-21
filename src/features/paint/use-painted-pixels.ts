"use client";

import { useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import type { Client } from "@/features/wallet/use-client";

async function getStrokesFromLogs(
  client: Client,
  day: number,
  onNewPixels: (pixels: string) => void,
  ac: AbortController
) {
  let latestBlock = await client.getBlockNumber();
  let logs: { day: number; pixels: string }[] = [];
  const BATCH_SIZE = 10_000n;
  for (
    let toBlock = latestBlock;
    toBlock > BATCH_SIZE;
    toBlock -= BATCH_SIZE
  ) {
    const fromBlock = toBlock - BATCH_SIZE + 1n;

    const batchLogs = await client.getLogs({
      address: BASEPAINT_ADDRESS,
      event: parseAbiItem(
        "event Painted(uint256 indexed day, uint256 tokenId, address author, bytes pixels)"
      ),
      fromBlock,
      toBlock,
      strict: true,
    });

    logs = [
      ...batchLogs.map((log) => ({
        day: Number(log.args.day),
        pixels: log.args.pixels,
      })),
      ...logs,
    ];

    if (logs[0].day < day) {
      break;
    }
  }

  async function poll() {
    const fromBlock = latestBlock + 1n;
    const toBlock = await client.getBlockNumber();

    const batchLogs = await client.getLogs({
      address: BASEPAINT_ADDRESS,
      event: parseAbiItem(
        "event Painted(uint256 indexed day, uint256 tokenId, address author, bytes pixels)"
      ),
      args: { day: BigInt(day) },
      fromBlock,
      toBlock,
      strict: true,
    });

    latestBlock = toBlock;
    const pixels = batchLogs
      .map((log) => log.args.pixels.replace(/^0x/, ""))
      .join("");
    onNewPixels(pixels);
  }

  const interval = setInterval(() => {
    if (ac.signal.aborted) {
      clearInterval(interval);
    } else {
      poll();
    }
  }, 15_000);

  return logs
    .filter((log) => log.day === day)
    .map((log) => log.pixels.replace(/^0x/, ""))
    .join("");
}

export function usePaintedPixels(client: Client, day: number) {
  const [pixels, setPixels] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    getStrokesFromLogs(
      client,
      day,
      (morePixels) => setPixels((old) => old + morePixels),
      ac
    ).then(setPixels);

    return () => ac.abort();
  }, [client, day]);

  return pixels;
}
