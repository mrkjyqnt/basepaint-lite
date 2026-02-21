"use client";

import { useWalletContext } from "@/features/wallet/wallet-provider";
import { useToday } from "@/features/paint/use-today";
import WithdrawView from "@/features/withdraw/withdraw-view";
import Loading from "@/components/loading";

export default function WithdrawPage() {
  const { client, address } = useWalletContext();

  const today = useToday(client);
  if (!today) {
    return <Loading what="today" />;
  }

  return (
    <WithdrawView client={client} today={today.day} address={address} />
  );
}
