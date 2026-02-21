"use client";

import { useMemo, useState } from "react";
import { createWalletClient, custom, publicActions } from "viem";
import { base } from "viem/chains";

export type Client = NonNullable<ReturnType<typeof useClient>>;

export function useClient() {
  const [ethereum] = useState(() => (window as any).ethereum ?? null);

  const client = useMemo(() => {
    if (!ethereum) return null;
    return createWalletClient({
      chain: base,
      transport: custom(ethereum),
    }).extend(publicActions);
  }, [ethereum]);

  return client;
}
