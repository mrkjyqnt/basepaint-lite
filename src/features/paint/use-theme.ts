"use client";

import { parseAbi } from "viem";
import { METADATA_ADDRESS } from "@/lib/constants";
import { usePromise } from "@/lib/use-promise";
import type { Client } from "@/features/wallet/use-client";

async function fetchThemeFromBasepaint(day: number) {
  const request = await fetch(`https://basepaint.xyz/api/theme/${day}`);
  return (await request.json()) as {
    theme: string;
    palette: string[];
    size: number;
  };
}

async function fetchThemeFromBlockchain(client: Client, day: number) {
  const metadata = await client.readContract({
    address: METADATA_ADDRESS,
    abi: parseAbi([
      "function getMetadata(uint256 id) public view returns ((string name, uint24[] palette, uint96 size, address proposer))",
    ]),
    functionName: "getMetadata",
    args: [BigInt(day)],
  });

  if (!metadata.name) {
    throw new Error(`No theme found for day ${day} onchain`);
  }

  return {
    theme: metadata.name,
    palette: metadata.palette.map(
      (color) => `#${color.toString(16).padStart(6, "0")}`
    ),
    size: Number(metadata.size),
  };
}

export function useTheme(client: Client, day: number) {
  return usePromise(
    () =>
      fetchThemeFromBlockchain(client, day).catch(() =>
        fetchThemeFromBasepaint(day)
      ),
    [day]
  );
}
