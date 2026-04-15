#!/usr/bin/env python3
"""
Arc Latency Data Collection Script
Measures Arc transaction latency and updates data files for the monitor dashboard.
"""

import json
import os
import sys
import time
import statistics
from datetime import datetime
from typing import List

try:
    from web3 import Web3
    from eth_account import Account
except ImportError:
    print("Error: web3 and eth-account packages required. Install with: pip install web3 eth-account")
    sys.exit(1)

# ---------------------------------------------------------------------
# Network config (Arc testnet)
# ---------------------------------------------------------------------
ARC_CONFIG = {
    "rpc": os.getenv("RPC_URL", "https://rpc.testnet.arc.network"),
    "contract": os.getenv("LATENCY_CONTRACT", "),
    "sync_method": os.getenv("TX_SEND_METHOD", "eth_sendRawTransaction"),
    "chain_id": 5042002,
}

TARGET_FEE_USDC = 0.01
PRIVATE_KEY = os.getenv("PK") or os.getenv("PRIVATE_KEY")
LATENCY_CONTRACT = 0xB7CaAbfbeb33e34470A3C9e0C7833AC0296210CF

# ---------------------------------------------------------------------
# ABI (increment function only)
# ---------------------------------------------------------------------
ABI = [
    {
        "inputs": [],
        "name": "increment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

# ---------------------------------------------------------------------
# Nonce Allocator
# ---------------------------------------------------------------------
class NonceAllocator:
    def __init__(self, web3: Web3, address: str):
        self.web3 = web3
        self.address = address
        self.next_nonce = None

    def initialize(self):
        self.next_nonce = self.web3.eth.get_transaction_count(
            self.address, block_identifier="latest"
        )

    def get(self) -> int:
        if self.next_nonce is None:
            raise RuntimeError("NonceAllocator not initialized")
        nonce = self.next_nonce
        self.next_nonce += 1
        return nonce

# ---------------------------------------------------------------------
# Native synchronous send
# ---------------------------------------------------------------------
def send_native_sync(w3: Web3, signed_tx) -> dict:
    method = ARC_CONFIG["sync_method"]
    
    if isinstance(signed_tx, bytes):
        raw_tx = Web3.to_hex(signed_tx)
    elif isinstance(signed_tx, str):
        raw_tx = signed_tx if signed_tx.startswith("0x") else "0x" + signed_tx
    else:
        raise TypeError(f"Invalid signed_tx type: {type(signed_tx)}")

    response = w3.provider.make_request(method, [raw_tx])

    if "error" in response:
        raise RuntimeError(f"Arc RPC error: {response['error']}")

    if response.get("result") is None:
        raise RuntimeError("Arc RPC returned no result")

    tx_hash = response["result"]
    # For async send methods (e.g. eth_sendRawTransaction), wait for receipt.
    if method == "eth_sendRawTransaction":
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        return dict(receipt)
    return tx_hash


def percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]

    sorted_values = sorted(values)
    index = min(len(sorted_values) - 1, max(0, int(round((len(sorted_values) - 1) * pct))))
    return sorted_values[index]


def average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0

# ---------------------------------------------------------------------
# Measure Arc latency
# ---------------------------------------------------------------------
def measure_arc_telemetry(num_txs: int = 10) -> dict:
    """
    Measure Arc latency, fee stability, and deterministic finality telemetry.
    Arc receipts are treated as finality points because Arc finality is deterministic.
    """
    w3 = Web3(Web3.HTTPProvider(ARC_CONFIG["rpc"]))

    if not w3.is_connected():
        raise ConnectionError("Cannot connect to Arc testnet")

    if not PRIVATE_KEY:
        raise ValueError("Environment variable PK or PRIVATE_KEY not set (testnet wallet private key)")
    if not ARC_CONFIG["contract"]:
        raise ValueError("Environment variable LATENCY_CONTRACT not set")

    account = Account.from_key(PRIVATE_KEY)
    contract = w3.eth.contract(address=ARC_CONFIG["contract"], abi=ABI)

    allocator = NonceAllocator(w3, account.address)
    allocator.initialize()

    latencies: List[float] = []
    fee_costs_usdc: List[float] = []
    gas_prices_gwei: List[float] = []
    gas_used_values: List[float] = []
    base_fees_gwei: List[float] = []
    failed = 0
    succeeded = 0
    block_cache = {}

    fn = contract.functions.increment()
    chain_id = ARC_CONFIG["chain_id"]
    gas_price = w3.eth.gas_price
    gas = 100_000

    print(f"Measuring {num_txs} transactions in burst mode on Arc testnet...")

    for i in range(num_txs):
        try:
            tx = fn.build_transaction(
                {
                    "from": account.address,
                    "nonce": allocator.get(),
                    "gas": gas,
                    "gasPrice": gas_price,
                    "chainId": chain_id,
                }
            )
            signed = account.sign_transaction(tx)
            start = time.perf_counter()
            receipt = send_native_sync(w3, signed.raw_transaction)
            end = time.perf_counter()
            latency_ms = (end - start) * 1000

            status = int(receipt.get("status", 1))
            if status != 1:
                print(f"  Transaction {i+1}/{num_txs} reverted onchain")
                failed += 1
                continue

            latencies.append(latency_ms)
            succeeded += 1

            gas_used = int(receipt.get("gasUsed", 0))
            effective_gas_price = int(receipt.get("effectiveGasPrice", gas_price))
            fee_cost_usdc = (gas_used * effective_gas_price) / 10**18

            gas_used_values.append(float(gas_used))
            gas_prices_gwei.append(effective_gas_price / 10**9)
            fee_costs_usdc.append(fee_cost_usdc)

            block_number = receipt.get("blockNumber")
            if block_number is not None:
                if block_number not in block_cache:
                    block = w3.eth.get_block(block_number)
                    block_cache[block_number] = int(block.get("baseFeePerGas", 0))
                base_fees_gwei.append(block_cache[block_number] / 10**9)

            print(f"  Transaction {i+1}/{num_txs}: {latency_ms:.2f}ms")
            # Burst mode: no delay between transactions
        except Exception as e:
            print(f"  Transaction {i+1}/{num_txs} failed: {e}")
            failed += 1

    if not latencies:
        raise RuntimeError("No successful transactions. Cannot calculate metrics.")

    latency_p50 = statistics.median(sorted(latencies))
    latency_p95 = percentile(latencies, 0.95)
    latency_p99 = percentile(latencies, 0.99)
    latency_avg = average(latencies)

    fee_p50 = statistics.median(sorted(fee_costs_usdc))
    fee_p95 = percentile(fee_costs_usdc, 0.95)
    fee_p99 = percentile(fee_costs_usdc, 0.99)
    fee_avg = average(fee_costs_usdc)
    fee_spread = max(fee_p95 - fee_p50, 0)
    fee_volatility_pct = (fee_spread / fee_avg * 100) if fee_avg else 0.0

    success_rate_pct = (succeeded / num_txs) * 100 if num_txs else 0.0
    finality_under_1s_rate_pct = (
        len([latency for latency in latencies if latency <= 1000]) / len(latencies) * 100
        if latencies
        else 0.0
    )
    avg_gas_used = average(gas_used_values)
    avg_gas_price_gwei = average(gas_prices_gwei)
    avg_base_fee_gwei = average(base_fees_gwei)

    print(
        f"\nLatency: P50={latency_p50:.2f}ms, P95={latency_p95:.2f}ms, P99={latency_p99:.2f}ms"
    )
    print(
        f"Fees: avg={fee_avg:.5f} USDC, p95={fee_p95:.5f} USDC, volatility={fee_volatility_pct:.2f}%"
    )
    print(
        f"Finality: avg={latency_avg:.2f}ms, under_1s={finality_under_1s_rate_pct:.2f}%, success={success_rate_pct:.2f}%"
    )
    if failed > 0:
        print(f"Warning: {failed} transactions failed")

    return {
        "latency": {
            "p50Ms": round(latency_p50, 2),
            "p95Ms": round(latency_p95, 2),
            "p99Ms": round(latency_p99, 2),
            "avgMs": round(latency_avg, 2),
        },
        "fee": {
            "targetUsdc": TARGET_FEE_USDC,
            "avgUsdc": round(fee_avg, 6),
            "p50Usdc": round(fee_p50, 6),
            "p95Usdc": round(fee_p95, 6),
            "p99Usdc": round(fee_p99, 6),
            "spreadUsdc": round(fee_spread, 6),
            "avgGasPriceGwei": round(avg_gas_price_gwei, 3),
            "avgGasUsed": round(avg_gas_used, 0),
            "avgBaseFeeGwei": round(avg_base_fee_gwei, 3),
            "volatilityPct": round(fee_volatility_pct, 2),
        },
        "finality": {
            "avgMs": round(latency_avg, 2),
            "p95Ms": round(latency_p95, 2),
            "under1sRatePct": round(finality_under_1s_rate_pct, 2),
            "successRatePct": round(success_rate_pct, 2),
            "reorgsObserved": 0,
            "deterministic": True,
        },
        "sampleCount": num_txs,
        "successfulSamples": succeeded,
        "failedSamples": failed,
        "successRatePct": round(success_rate_pct, 2),
    }

# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    data_dir = os.path.join(project_root, "data")

    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)

    try:
        # Measure telemetry
        stats = measure_arc_telemetry(num_txs=10)

        # Update latest.json
        latest = {
            "p50": stats["latency"]["p50Ms"],
            "p95": stats["latency"]["p95Ms"],
            "p99": stats["latency"]["p99Ms"],
            "updated": datetime.now().isoformat(),
            "chainId": ARC_CONFIG["chain_id"],
            "contractAddress": ARC_CONFIG["contract"],
            "sampleCount": stats["sampleCount"],
            "successfulSamples": stats["successfulSamples"],
            "failedSamples": stats["failedSamples"],
            "successRatePct": stats["successRatePct"],
            "latency": stats["latency"],
            "fee": stats["fee"],
            "finality": stats["finality"],
        }

        latest_path = os.path.join(data_dir, "latest.json")
        with open(latest_path, 'w') as f:
            json.dump(latest, f, indent=2)
        print(f"\n✓ Updated {latest_path}")

        # Update history.json
        history_path = os.path.join(data_dir, "history.json")
        history = []
        if os.path.exists(history_path):
            with open(history_path, 'r') as f:
                history = json.load(f)

        # Append new data point
        history.append({
            "timestamp": datetime.now().isoformat(),
            "time": datetime.now().strftime("%H:%M"),
            "p50": latest["p50"],
            "p95": latest["p95"],
            "p99": latest["p99"],
            "latencyP50Ms": stats["latency"]["p50Ms"],
            "latencyP95Ms": stats["latency"]["p95Ms"],
            "latencyP99Ms": stats["latency"]["p99Ms"],
            "feeAvgUsdc": stats["fee"]["avgUsdc"],
            "feeP50Usdc": stats["fee"]["p50Usdc"],
            "feeP95Usdc": stats["fee"]["p95Usdc"],
            "feeP99Usdc": stats["fee"]["p99Usdc"],
            "feeSpreadUsdc": stats["fee"]["spreadUsdc"],
            "avgGasPriceGwei": stats["fee"]["avgGasPriceGwei"],
            "avgGasUsed": stats["fee"]["avgGasUsed"],
            "avgBaseFeeGwei": stats["fee"]["avgBaseFeeGwei"],
            "finalityAvgMs": stats["finality"]["avgMs"],
            "finalityP95Ms": stats["finality"]["p95Ms"],
            "finalityUnder1sRatePct": stats["finality"]["under1sRatePct"],
            "successRatePct": stats["successRatePct"],
            "sampleCount": stats["sampleCount"],
            "successfulSamples": stats["successfulSamples"],
            "failedSamples": stats["failedSamples"],
        })

        # Keep the last 90 days of hourly samples.
        history = history[-2160:]

        with open(history_path, 'w') as f:
            json.dump(history, f, indent=2)
        print(f"✓ Updated {history_path}")

        print("\n✅ Data collection complete!")

    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
