"use client";

import { parseAbi } from "viem";
import type { Address } from "viem";
import { BRUSH_ADDRESS } from "@/lib/constants";
import { usePromise } from "@/lib/use-promise";
import type { Client } from "@/features/wallet/use-client";

async function fetchBrushes(client: Client, address: Address) {
  const events = await client.getContractEvents({
    abi: parseAbi([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ]),
    address: BRUSH_ADDRESS,
    eventName: "Transfer",
    args: { to: address },
    strict: true,
    fromBlock: 0n,
  });

  const tokenIds = events.map((e) => e.args.tokenId);
  const owners = await Promise.all(
    tokenIds.map((id) =>
      client.readContract({
        abi: parseAbi(["function ownerOf(uint256) view returns (address)"]),
        functionName: "ownerOf",
        address: BRUSH_ADDRESS,
        args: [id],
      })
    )
  );

  const ownedTokenIds = tokenIds.filter((_, i) => owners[i] === address);
  const strengths = await Promise.all(
    ownedTokenIds.map((id) =>
      client.readContract({
        abi: parseAbi(["function strengths(uint256) view returns (uint256)"]),
        functionName: "strengths",
        address: BRUSH_ADDRESS,
        args: [id],
      })
    )
  );

  return ownedTokenIds
    .map((id, i) => ({ id, strength: strengths[i] }))
    .sort((a, b) => Number(b.strength - a.strength));
}

export function useBrushes(client: Client, address: Address) {
  return usePromise(
    () => fetchBrushes(client, address).catch(() => []),
    [address]
  );
}
