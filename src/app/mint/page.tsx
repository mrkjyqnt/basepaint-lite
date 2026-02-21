"use client";

import { useWalletContext } from "@/features/wallet/wallet-provider";
import { useToday } from "@/features/paint/use-today";
import { useTheme } from "@/features/paint/use-theme";
import { usePaintedPixels } from "@/features/paint/use-painted-pixels";
import { usePrice } from "@/features/mint/use-price";
import MintView from "@/features/mint/mint-view";
import Loading from "@/components/loading";
import type { Client } from "@/features/wallet/use-client";
import type { Address } from "viem";

export default function MintPage() {
  const { client, address } = useWalletContext();

  const today = useToday(client);
  if (!today) return <Loading what="today" />;

  return (
    <MintWithData client={client} address={address} day={today.day - 1} />
  );
}

function MintWithData({
  client,
  address,
  day,
}: {
  client: Client;
  address: Address;
  day: number;
}) {
  const theme = useTheme(client, day);
  const pixels = usePaintedPixels(client, day);
  const price = usePrice(client);

  if (!theme) return <Loading what="theme" />;
  if (pixels === null) return <Loading what="pixels" />;
  if (!price) return <Loading what="price" />;

  return (
    <MintView
      client={client}
      address={address}
      day={day}
      theme={theme.theme}
      palette={theme.palette}
      size={theme.size}
      pixels={pixels}
      price={price}
    />
  );
}
