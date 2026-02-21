"use client";

import { useWalletContext } from "@/features/wallet/wallet-provider";
import { useToday } from "@/features/paint/use-today";
import { useTheme } from "@/features/paint/use-theme";
import { useBrushes } from "@/features/paint/use-brushes";
import { usePaintedPixels } from "@/features/paint/use-painted-pixels";
import Canvas from "@/features/paint/canvas";
import Loading from "@/components/loading";
import type { Client } from "@/features/wallet/use-client";
import type { Address } from "viem";

export default function PaintPage() {
  const { client, address } = useWalletContext();

  const today = useToday(client);
  if (!today) return <Loading what="today" />;

  return (
    <PaintWithTheme
      client={client}
      address={address}
      day={today.day}
      epochDuration={today.epochDuration}
      startedAt={today.startedAt}
    />
  );
}

function PaintWithTheme({
  client,
  address,
  day,
  epochDuration,
  startedAt,
}: {
  client: Client;
  address: Address;
  day: number;
  epochDuration: bigint;
  startedAt: bigint;
}) {
  const theme = useTheme(client, day);
  const pixels = usePaintedPixels(client, day);
  const brushes = useBrushes(client, address);

  if (!theme) return <Loading what="theme" />;
  if (pixels === null) return <Loading what="pixels" />;

  return (
    <Canvas
      client={client}
      address={address}
      brushes={brushes ?? []}
      day={day}
      epochDuration={epochDuration}
      startedAt={startedAt}
      theme={theme.theme}
      palette={theme.palette}
      size={theme.size}
      pixels={pixels}
    />
  );
}
