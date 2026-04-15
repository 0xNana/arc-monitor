# Arc Latency Monitor

Real-time transaction latency tracking for Arc Testnet.

## Features
- Live P50/P95/P99 metrics
- Fee stability tracking in native USDC
- Deterministic finality / reliability tracking
- 24-hour historical data
- Updated every hour
- Based on real transactions

## Data Source
Continuous burst load testing: sends 10 transactions back-to-back every hour to measure how Arc handles sustained throughput. Each burst records latency, fee, and deterministic-finality telemetry from real Arc receipts.

## Arc Testnet Network Details

- Network: Arc Testnet
- Chain ID: `5042002`
- Currency / gas token: `USDC` (18 decimals)
- RPC endpoint: `https://rpc.testnet.arc.network`
- WebSocket: `wss://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000 to see the dashboard.

```bash
export ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
export PK="yprivate_key" # or export PRIVATE_KEY="..."
```

After deployment, set both of these to the new address so the collector and UI stay in sync:

```bash
export LATENCY_CONTRACT="0x..."
export NEXT_PUBLIC_LATENCY_CONTRACT="0x..."
```

### Data Collection

The data collection script runs automatically via GitHub Actions every hour. To run manually:

```bash
# Set your testnet private key (use a testnet-only wallet)
export PK="private_key"
export LATENCY_CONTRACT="0x...elegant"

# Run collection script
python scripts/collect.py
```

⚠️ **Warning**: Never use a mainnet private key. Always use a testnet-only wallet.
The collector now requires `LATENCY_CONTRACT`; there is no baked-in default address.

## Roadmap
- [ ] Extend to 7-day history
- [ ] Add alerting system
- [ ] API access

Built by [@0xelegant](https://x.com/0xelegant)
