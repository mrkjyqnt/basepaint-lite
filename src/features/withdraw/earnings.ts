import type { Address } from "viem";
import { keccak256, toHex } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import type { Client } from "@/features/wallet/use-client";

function getSlot(day: number, address: Address) {
  const canvasesSlot = 5; // forge inspect BasePaint storage-layout --pretty
  const canvasesHex = toHex(canvasesSlot, { size: 32 });
  const dayHex = toHex(day, { size: 32 });
  const canvasesDaySlot = keccak256(
    `0x${dayHex.slice(2) + canvasesHex.slice(2)}`
  );
  const contributionsSlot = toHex(BigInt(canvasesDaySlot) + 2n);
  const addressContributionsSlot = keccak256(
    `0x${address.slice(2).padStart(64, "0") + contributionsSlot.slice(2)}`
  );
  return addressContributionsSlot;
}

export async function getEarningsForDay(
  client: Client,
  address: Address,
  day: number
) {
  const slot = getSlot(day, address);
  const result = await client.getStorageAt({
    address: BASEPAINT_ADDRESS,
    slot,
  });
  return BigInt(result ?? 0);
}
