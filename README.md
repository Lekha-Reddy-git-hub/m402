# m402

**Machine Payment Required** -- an open protocol for machine-native payments on physical-world data networks.

**Live demo:** [m402.vercel.app](https://m402.vercel.app)

---

## What is m402?

m402 extends the [x402](https://x402.org) payment standard from the web to the physical world. Where x402 enables internet-native payments between clients and servers, m402 enables autonomous systems -- self-driving cars, delivery drones, industrial robots -- to purchase real-world sensor data through instant stablecoin micropayments.

The protocol uses the HTTP 402 status code. A machine requests data, receives a payment prompt, pays in stablecoins, and gets the data back. One atomic transaction. No contracts, no subscriptions, no humans in the loop.

```python
agent = m402.Agent(wallet="0x...machine")

data = await agent.query(
    provider="hivemapper",
    lat=-23.5505, lng=-46.6333,
    radius_m=100
)
# $0.001 | settled in <1s | memo attached
```

## Why m402?

Autonomous systems make thousands of decisions per hour. Every time they need data -- street imagery, GPS corrections, weather conditions, vehicle telemetry -- a human currently has to negotiate a contract, manage a subscription, or provision an API key.

m402 removes the human from the payment loop.

| Problem | Current State | With m402 |
|---|---|---|
| Data access | Enterprise contracts, 3-6 week onboarding | Instant, permissionless |
| Payment size | $10K+ annual minimums | $0.001 per query |
| Settlement | Net-30 invoicing | Sub-second finality |
| Integration | Custom per provider | One standard, any provider |
| Utilization | Machines use less than 5% of purchased data | Pay only for what you query |

## Architecture

m402 is built on [Tempo](https://tempo.xyz), a payment-optimized L2 incubated by Stripe and Paradigm. Tempo provides the infrastructure that general-purpose blockchains lack for high-frequency micropayments:

- **Stablecoin gas** -- Transaction fees paid in any stablecoin. No ETH required.
- **Sub-second settlement** -- Finality faster than a single Ethereum block.
- **Native 32-byte memos** -- Every payment carries structured metadata for automatic reconciliation.
- **Dedicated payment lanes** -- Blockspace reserved for payments, never competing with DeFi or memecoins.
- **100,000+ TPS** -- Designed for machine-scale throughput.
- **~$0.0001 per transaction** -- 100x cheaper than general L2s.

## Connected Sensor Networks

| Network | Data Type | Coverage | Price per Query |
|---|---|---|---|
| Hivemapper | Street-level imagery | 300K+ dashcams | $0.001 |
| DIMO | Vehicle telemetry | 1M+ vehicles | $0.001 |
| Geodnet | cm-precision GPS | 13K+ stations | $0.002 |
| WeatherXM | Hyperlocal weather | 6K+ stations | $0.0005 |

## Live Demo

The landing page at [m402.vercel.app](https://m402.vercel.app) includes a working demo that executes a real transaction on Tempo Testnet (Chain ID 42431). You can:

1. Connect a MetaMask wallet
2. Claim free testnet AlphaUSD from the faucet
3. Execute a Hivemapper street query with an on-chain memo
4. View the transaction on [Tempo Scout Explorer](https://scout.tempo.xyz)

No real funds are involved. The demo uses Tempo's testnet faucet and AlphaUSD, a testnet stablecoin.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Wallet integration | wagmi v2, viem |
| Blockchain | Tempo Testnet (EVM-compatible) |
| Token standard | TIP-20 (ERC-20 with native memos) |
| Hosting | Vercel |
| Fonts | Instrument Serif, DM Sans, DM Mono |

## Local Development

```bash
git clone https://github.com/Lekha-Reddy-git-hub/m402.git
cd m402
npm install
npx vite --host
```

Open `http://localhost:5173` in a browser with MetaMask installed.

### Tempo Testnet Configuration (MetaMask)

| Field | Value |
|---|---|
| Network Name | Tempo Testnet (Moderato) |
| RPC URL | `https://rpc.moderato.tempo.xyz` |
| Chain ID | 42431 |
| Currency Symbol | USD |
| Explorer | `https://scout.tempo.xyz` |

## Project Structure

```
m402/
  index.html          # Entry point, favicon, metadata
  vite.config.js      # Vite configuration
  package.json        # Dependencies
  src/
    main.jsx          # React root, wagmi provider setup
    App.jsx           # All UI components and page layout
    config.js         # Chain config, contract addresses, ABI
```

## Protocol Flow

```
Machine                    Data Provider                  Tempo
  |                             |                           |
  |-- GET /street-data -------->|                           |
  |<-- 402 Payment Required ----|                           |
  |                             |                           |
  |-- Pay 0.001 AlphaUSD ------|-------------------------->|
  |                             |<-- Payment confirmed -----|
  |<-- Street imagery data -----|                           |
  |                             |                           |
  Total time: <1 second
  Total cost: ~$0.001 + ~$0.0001 network fee
```

## Related

- [x402](https://x402.org) -- The internet-native payment standard that m402 extends
- [Tempo](https://tempo.xyz) -- The payment-optimized L2 powering m402
- [Hivemapper](https://hivemapper.com) -- Decentralized street-level imagery network
- [DIMO](https://dimo.zone) -- Decentralized vehicle data network

## License

MIT

## Author

**Srilekha Reddy** -- [LinkedIn](https://www.linkedin.com/in/srilekha-reddy/) | [GitHub](https://github.com/Lekha-Reddy-git-hub)
