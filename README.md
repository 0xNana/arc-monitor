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

### Contract Deployment

The benchmark contract used by this monitor is `LatencyTest` from the sibling Foundry project at `/home/elegant/contracts/latency-test`.

```bash
cd /home/elegant/contracts/latency-test
export ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
export PK="your_testnet_private_key" # or export PRIVATE_KEY="..."
forge script script/LatencyTest.s.sol:LatencyTestScript --rpc-url arc --broadcast
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
export PK="your_testnet_private_key"
export LATENCY_CONTRACT="0x..."

# Run collection script
python scripts/collect.py
```

⚠️ **Warning**: Never use a mainnet private key. Always use a testnet-only wallet.
The collector now requires `LATENCY_CONTRACT`; there is no baked-in default address.

## Roadmap
- [ ] Add MegaETH comparison
- [ ] Extend to 7-day history
- [ ] Add alerting system
- [ ] API access

Built by [@0xelegant](https://x.com/0xelegant)
