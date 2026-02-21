"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import type { Client } from "./use-client";

export function useWallet(client: Client) {
  const [address, setAddress] = useState<Address | null>(null);

  const connect = useCallback(() => {
    client
      .requestAddresses()
      .then((addresses) => addresses.length > 0 && setAddress(addresses[0]))
      .catch(() => {});
  }, [client]);

  useEffect(() => {
    client
      .getAddresses()
      .then((addresses) => addresses.length > 0 && setAddress(addresses[0]))
      .catch(() => {});

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAddress(accounts.length > 0 ? (accounts[0] as Address) : null);
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [client]);

  return { address, connect };
}
