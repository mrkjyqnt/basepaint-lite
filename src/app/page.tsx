"use client";

import Link from "next/link";
import BasePaintHero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-[360px] max-w-[95vw]">
        <CardContent className="flex flex-col items-center gap-3">
          <BasePaintHero />
          <Button asChild size="lg" className="w-full">
            <Link href="/paint">Paint</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/mint">Mint</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/withdraw">Withdraw</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
