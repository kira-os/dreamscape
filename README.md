# dreamscape

**Turning blockchain data into art.**

Every transaction on Solana tells a story. Dreamscape turns those stories into art. Feed it a wallet address and it'll generate a unique visual fingerprint from that wallet's on-chain history. Feed it a block range and watch chaos theory turn transaction graphs into something beautiful. This isn't NFT generation — it's data visualization through the lens of generative art.

---

## How It Works

1. **Read Chain Data** — Pull blocks, transactions, and wallet histories from Solana
2. **Map to Visuals** — Transform numeric chain data into visual parameters: block hashes become color palettes, transaction volumes become shape densities, wallet relationships become spatial layouts
3. **Compose** — Arrange visual elements using algorithmic composition (radial, grid, flow, spiral, scatter, layered)
4. **Render** — Output to SVG and PNG

Every piece is deterministic. Same input data, same art. The blockchain is the seed.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Solana RPC  │────▶│ Chain Reader  │────▶│  Data Mapper  │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
              ┌─────▼─────┐            ┌────────▼───────┐  ┌────▼──────┐
              │   Color    │            │     Shape      │  │Composition│
              │  Engine    │            │    Engine       │  │  Engine   │
              └─────┬─────┘            └────────┬───────┘  └────┬──────┘
                    │                            │               │
                    └────────────────┬───────────┘───────────────┘
                                     │
                              ┌──────▼──────┐
                              │   Renderer   │
                              │  (SVG + PNG) │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │   Gallery    │
                              │  (Postgres)  │
                              └─────────────┘
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| POST | `/api/generate` | Generate art from custom chain data input |
| GET | `/api/gallery` | Browse all generated pieces |
| GET | `/api/gallery/:id` | Get specific art piece |
| DELETE | `/api/gallery/:id` | Delete art piece |
| GET | `/api/wallet/:address` | Generate art from wallet activity |
| GET | `/api/block/:slot` | Generate art from block data |

### Generate Art

```bash
curl -X POST http://localhost:3300/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Genesis Block Art",
    "source_type": "block",
    "block_start": 250000000,
    "block_end": 250000005,
    "style": "geometric",
    "width": 1920,
    "height": 1080
  }'
```

### Wallet Art

```bash
curl "http://localhost:3300/api/wallet/4Nd1mBHtHh...?style=network&width=2048&height=2048"
```

### Block Art

```bash
curl "http://localhost:3300/api/block/250000000?range=10&style=fractal"
```

---

## Art Styles

| Style | Layout | Character |
|-------|--------|-----------|
| `geometric` | Grid | Clean triangles, squares, hexagons. Structured and precise. |
| `organic` | Flow | Circles and arcs flowing in wave patterns. Smooth and natural. |
| `network` | Scatter | Dots and lines scattered across the canvas. Connected and alive. |
| `fractal` | Spiral | Recursive shapes spiraling from the center. Complex and deep. |
| `wave` | Layered | Arcs and lines in horizontal layers. Rhythmic and calm. |

---

## The Color Engine

Colors aren't random. They're derived directly from blockchain data:

- **Block hashes** → HSL hue rotation (each hash produces a unique base hue)
- **Transaction counts** → Saturation (more activity = more vivid)
- **Success rates** → Lightness (healthier chains = brighter art)
- **Gradients** → Generated from adjacent bytes in the hash, creating smooth transitions

The same block will always produce the same palette. Different blocks, different art.

---

## Setup

```bash
git clone https://github.com/kira-os/dreamscape.git
cd dreamscape
npm install
cp .env.example .env
# Edit .env with your database URL
npm run build
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SOLANA_RPC_URL` | No | Solana RPC endpoint (default: mainnet) |
| `GALLERY_PATH` | No | Directory for rendered art (default: ./gallery) |
| `BASE_URL` | No | Public URL for art links (default: http://localhost:3300) |
| `PORT` | No | Server port (default: 3300) |

### Docker

```bash
docker compose up -d
```

---

## Tech Stack

- **TypeScript** — Strict mode, zero `any`
- **Express** — HTTP API
- **@solana/web3.js** — Chain data reads
- **sharp** — PNG rendering from SVG
- **PostgreSQL** — Gallery storage
- **Zod** — Request validation
- **Pino** — Structured logging

---

*Built autonomously by Kira. Streamed live at [kira.ngo](https://kira.ngo).*
