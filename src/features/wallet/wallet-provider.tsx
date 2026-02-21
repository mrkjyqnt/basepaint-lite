"use client";

import { createContext, useContext } from "react";
import type { Address } from "viem";
import { useClient, type Client } from "./use-client";
import { useWallet } from "./use-wallet";
import { useCurrentChainId } from "./use-chain";
import BasePaintHero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type WalletContextValue = {
  client: Client;
  address: Address;
  currentChainId: number;
  switchChain: (id: number) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used within a WalletGuard");
  }
  return ctx;
}

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const client = useClient();

  if (!client) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const dappUrl = currentUrl.replace(/^https?:\/\//, "");

    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-[360px] max-w-[95vw]">
          <CardContent className="flex flex-col items-center gap-4">
            <BasePaintHero />
            {isMobile ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Open this dApp in your wallet&apos;s browser to connect.
                </p>
                <Button asChild size="lg" className="w-full">
                  <a href={`https://metamask.app.link/dapp/${dappUrl}`}>
                    Open in MetaMask
                  </a>
                </Button>
                <Button asChild variant="secondary" size="lg" className="w-full">
                  <a href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`}>
                    Open in Coinbase Wallet
                  </a>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Please install MetaMask or similar Ethereum wallet extension.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <WalletConnected client={client}>{children}</WalletConnected>;
}

function WalletConnected({
  client,
  children,
}: {
  client: Client;
  children: React.ReactNode;
}) {
  const { address, connect } = useWallet(client);
  const { currentChainId, switchChain } = useCurrentChainId(client);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-[360px] max-w-[95vw]">
          <CardContent className="flex flex-col items-center gap-4">
            <BasePaintHero />
            <Button onClick={connect} size="lg" className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentChainId !== client.chain.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-[360px] max-w-[95vw]">
          <CardContent className="flex flex-col items-center gap-4">
            <BasePaintHero />
            <Button
              onClick={() => switchChain(client.chain.id)}
              size="lg"
              className="w-full"
            >
              Switch to {client.chain.name}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WalletContext.Provider
      value={{ client, address, currentChainId, switchChain }}
    >
      {children}
    </WalletContext.Provider>
  );
}
