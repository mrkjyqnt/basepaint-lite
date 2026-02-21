"use client";

import { useEffect, useState } from "react";
import { parseAbi } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import { usePromise } from "@/lib/use-promise";
import type { Client } from "@/features/wallet/use-client";

async function initialFetch(client: Client) {
  const [startedAt, epochDuration] = await Promise.all([
    client.readContract({
      abi: parseAbi(["function startedAt() view returns (uint256)"]),
      functionName: "startedAt",
      address: BASEPAINT_ADDRESS,
    }),
    client.readContract({
      abi: parseAbi(["function epochDuration() view returns (uint256)"]),
      functionName: "epochDuration",
      address: BASEPAINT_ADDRESS,
    }),
  ]);
  return { startedAt, epochDuration };
}

export function useToday(client: Client) {
  const info = usePromise(() => initialFetch(client), [client]);
  const [day, setDay] = useState<number | null>(null);

  useEffect(() => {
    if (!info) return;

    function computeDay() {
      if (!info) return;
      setDay(
        Number(
          (BigInt(Date.now()) / 1000n - info.startedAt) / info.epochDuration +
            1n
        )
      );
    }

    computeDay();

    const interval = setInterval(computeDay, 1000);
    return () => clearInterval(interval);
  }, [info]);

  if (!info || !day) {
    return null;
  }

  return { day, ...info };
}
