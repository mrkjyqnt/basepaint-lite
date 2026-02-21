"use client";

import { useEffect, useRef, useState } from "react";
import { parseAbi } from "viem";
import type { Address } from "viem";
import { BASEPAINT_ADDRESS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/features/wallet/use-client";
import { getEarningsForDay } from "./earnings";

export default function WithdrawView({
  client,
  today,
  address,
}: {
  client: Client;
  today: number;
  address: Address;
}) {
  const stop = useRef(false);
  const [progress, setProgress] = useState(0);
  const [unclaimedDays, setUnclaimedDays] = useState<number[]>([]);

  useEffect(() => {
    async function findDays() {
      for (let day = today - 2; day > 0; day--) {
        if (stop.current) return;
        const earnings = await getEarningsForDay(client, address, day);

        if (earnings > 0n) {
          setUnclaimedDays((days) => [...days, day]);
        }

        setProgress(Math.round((100 * (today - day)) / today));
      }
    }

    setProgress(0);
    setUnclaimedDays([]);
    findDays();

    return () => {
      stop.current = true;
    };
  }, [client, address, today]);

  async function withdraw() {
    stop.current = true;
    const chainId = await client.getChainId();
    if (chainId !== client.chain.id) {
      await client.switchChain(client.chain);
    }

    if (!unclaimedDays.length) {
      alert("No unclaimed days found");
      return;
    }

    await client.writeContract({
      account: address,
      address: BASEPAINT_ADDRESS,
      functionName: "authorWithdraw",
      abi: parseAbi(["function authorWithdraw(uint256[] calldata indexes)"]),
      args: [unclaimedDays.map((day) => BigInt(day))],
    });

    setUnclaimedDays([]);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-[360px] max-w-[95vw]">
        <CardHeader>
          <CardTitle>Withdraw Earnings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!stop.current && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Scanning for unclaimed days: {progress}%
              </p>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-sm">
            {unclaimedDays.length
              ? "Unclaimed earnings from: " + unclaimedDays.join(", ")
              : "No unclaimed days found yet"}
          </p>
          <Button onClick={withdraw} size="lg" className="w-full">
            Withdraw
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
