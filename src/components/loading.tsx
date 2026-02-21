export default function Loading({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
      Loading {what}…
    </div>
  );
}
