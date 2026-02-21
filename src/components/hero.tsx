export default function BasePaintHero() {
  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <svg
          width="32"
          height="13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          viewBox="0 0 255 102"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M104 1v5h7V1h10v6h19v6h19v7h19v6h20v6h19v6h13v13h6v6h7v13H60v-1h10v-6h5v-5h6v-5h5V37h-5V26h-6v-5H65v-5H49v5h-5v5h-6v6h-5v26h5v5h-5v5h-5v2H8v-5H7v-7H0V32h6v-6h6V13h6V7h19V1h48v4h-5v6h-5v5h5v6h5v5h6v-5h5v-6h6v-5h2V1ZM28 70v4h16v-4h10v4h6v-4h183v11h5v6h-5v1h-1v5h-6v-5h-7v6h-9v7h-35v-7h-25v-6h-20v-6H90v6h1v6h12v8H45v-6H32v-7H19v-7h-5v-5H8v-7h20Zm26 0H44v-1h5v-6h10v5h-5v2ZM38 1v6-6ZM19 8v5-5ZM1 44v-4 4Zm0 2v5-5Zm0 6v6h6-6v-6Zm0-1Zm0-6Zm6-13v-6 6Zm-6 1v5-5Zm0 6Zm12-13v-5 5Zm-1-6v-6 6Zm1 0ZM8 64v-6 6Zm0-6Zm25 37h12-12v-6 6Zm13 0Zm0 1v5h57-57v-5Zm-26-7h12-12Zm13 0Zm222-2h-7v6h7v-6Zm-1-19h-6 6v-6 6Zm-7-7h8v8h-8v-8Zm-138 39v-6 6h6-6Zm7 1h6v-8h-14v8h8Zm6-1h-6 6Z"
            fill="#0042DF"
          />
        </svg>
        <h1 className="text-xl font-bold tracking-tight">BasePaint Lite</h1>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Tiny implementation of the{" "}
        <a
          href="https://basepaint.xyz"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          BasePaint
        </a>{" "}
        dApp with zero external dependencies.
      </p>
    </div>
  );
}
