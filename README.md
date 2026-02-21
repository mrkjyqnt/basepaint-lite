# BasePaint Lite

A copy and improved version of [basepaint-mini](https://github.com/BasePaint/basepaint-mini), rebuilt with Next.js and modern tooling.

## Features

### Painting Tools
- **Pencil** - Freehand pixel drawing on the daily canvas
- **Eraser** - Remove pixels you've placed
- **Bucket Fill** - Flood-fill areas with the selected color
- **Rectangle** - Draw filled rectangles with live preview
- **Hand / Pan** - Pan around the canvas via click-and-drag

### Canvas Controls
- **Zoom In / Out** - Adjust pixel size for detailed or overview work
- **Color Palette** - Pick from the daily theme palette
- **Grid Overlay** - Pixel grid for precision placement
- **Canvas Reset** - Clear all local pixels and start over

### Wallet Integration
- **EIP-1193 Wallet Connection** - Connect via MetaMask or any injected wallet
- **Chain Detection & Switching** - Automatic Base network detection with one-click switch
- **Brush Ownership Validation** - Verifies brush NFT ownership before submitting

### Minting
- **Mint Previous Day's Canvas** - Mint the completed artwork from the prior day
- **Adjustable Mint Count** - Mint multiple copies in a single transaction
- **Live Price Display** - Shows total cost in ETH before minting

### Withdrawals
- **Earnings Scanner** - Scans all past days for unclaimed author earnings with progress bar
- **Batch Withdraw** - Withdraw all unclaimed earnings in one transaction

### General
- **Daily Countdown Timer** - Live countdown to the next canvas flip
- **Theme Display** - Shows the current day number and theme name
- **Touch Support** - Full touch/mobile support for all drawing tools
- **Responsive Layout** - Adapts toolbar and tool sidebar for desktop and mobile
- **Static Export** - Deployable to GitHub Pages via Next.js static export

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui** components
- **viem** for Ethereum interactions

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start painting.

## License

MIT License - See the original [basepaint-mini](https://github.com/BasePaint/basepaint-mini) for the upstream license.
