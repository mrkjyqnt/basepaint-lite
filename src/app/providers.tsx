"use client";

import { useEffect, useState } from "react";
import { WalletGuard } from "@/features/wallet/wallet-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <WalletGuard>{children}</WalletGuard>;
}
