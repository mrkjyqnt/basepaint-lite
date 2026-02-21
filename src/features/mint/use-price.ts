"use client";

import { parseAbi } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import { usePromise } from "@/lib/use-promise";
import type { Client } from "@/features/wallet/use-client";

export function usePrice(client: Client) {
  return usePromise(
    () =>
      client.readContract({
        abi: parseAbi(["function openEditionPrice() view returns (uint256)"]),
        functionName: "openEditionPrice",
        address: BASEPAINT_ADDRESS,
      }),
    []
  );
}
