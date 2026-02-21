"use client";

import { useCallback, useEffect, useState } from "react";
import type { Client } from "./use-client";

export function useCurrentChainId(client: Client) {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);

  useEffect(() => {
    client.getChainId().then(setCurrentChainId).catch(() => {});

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleChainChanged = (chainIdHex: string) => {
      setCurrentChainId(parseInt(chainIdHex, 16));
    };

    ethereum.on("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [client]);

  const switchChain = useCallback(
    (id: number) => {
      client
        .switchChain({ id })
        .then(() => setCurrentChainId(id))
        .catch(() => {});
    },
    [client]
  );

  return { currentChainId, switchChain };
}
