import fs from 'fs'
import path from 'path'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import {
  defaultLatestMetrics,
  formatPercent,
  formatUsdc,
  normalizeLatestMetrics,
} from '@/lib/monitorData'

function getLatestSnapshot() {
  const dataPath = path.join(process.cwd(), 'data', 'latest.json')

  try {
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    return normalizeLatestMetrics(raw)
  } catch {
    return defaultLatestMetrics
  }
}

export default function MethodologyPage() {
  const snapshot = getLatestSnapshot()

  const liveRows = [
    {
      label: 'Latency P50 / P95 / P99',
      value: `${snapshot.latency.p50Ms.toFixed(1)} / ${snapshot.latency.p95Ms.toFixed(1)} / ${snapshot.latency.p99Ms.toFixed(1)} ms`,
    },
    {
      label: 'Avg Fee / P95 Fee',
      value: `${formatUsdc(snapshot.fee.avgUsdc)} / ${formatUsdc(snapshot.fee.p95Usdc)} USDC`,
    },
    {
      label: 'Under-1s Finality',
      value: `${formatPercent(snapshot.finality.under1sRatePct)}%`,
    },
    {
      label: 'Success Rate',
      value: `${formatPercent(snapshot.successRatePct)}%`,
    },
    {
      label: 'Avg Gas Used / Gas Price',
      value: `${snapshot.fee.avgGasUsed.toFixed(0)} / ${snapshot.fee.avgGasPriceGwei.toFixed(3)} Gwei`,
    },
    {
      label: 'Reorgs Observed',
      value: `${snapshot.finality.reorgsObserved}`,
    },
  ]

  return (
    <div className="flex h-full w-full bg-[var(--bg-deep)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--bg-deep)]">
        <Header />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <header className="mb-12 border-b border-strict-border pb-8">
              <div className="flex items-center gap-2 text-primary mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Specifications // Core</span>
              </div>
              <h1 className="text-4xl mb-4 font-bold text-white uppercase tracking-tight">
                Measurement Methodology
              </h1>
              <p className="text-muted-slate text-lg leading-relaxed max-w-3xl">
                Arc Monitor runs a fixed hourly burst probe against a live Arc testnet contract and derives
                three metric families from the same receipt stream: latency, fee stability in native USDC,
                and deterministic finality / reliability.
              </p>
            </header>

            <section className="border-b border-strict-border pb-12 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-muted-slate">01.</span>
                <h2 className="text-xl uppercase tracking-tight font-bold text-white">Probe Design</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Execution Method</h4>
                  <p className="text-sm text-slate-300">
                    The collector sends signed transactions with <code className="text-primary font-mono">eth_sendRawTransaction</code>
                    and measures <span className="text-white font-medium">send → receipt</span> using{' '}
                    <code className="text-primary font-mono">time.perf_counter()</code>.
                  </p>
                </div>
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Finality Assumption</h4>
                  <p className="text-sm text-slate-300">
                    Arc finality is treated as deterministic, so receipt arrival is recorded as the dashboard’s
                    finalization point. Reliability is then tracked via under-1s rate, success rate, and observed reorg count.
                  </p>
                </div>
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Contract Workload</h4>
                  <p className="text-sm text-slate-300">
                    The probe calls <code className="text-primary font-mono">LatencyTest.increment()</code>, a minimal state write
                    chosen to keep the workload simple, repeatable, and attributable.
                  </p>
                </div>
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Derived Telemetry</h4>
                  <p className="text-sm text-slate-300">
                    Each receipt contributes latency timing, effective gas price, gas used, computed fee paid in USDC,
                    base fee context, and the finality / success classification for that sample.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-b border-strict-border pb-12 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-muted-slate">02.</span>
                <h2 className="text-xl uppercase tracking-tight font-bold text-white">Workload & Sampling</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Network</h4>
                  <p className="text-sm text-slate-300 font-mono">Arc Testnet</p>
                  <p className="text-xs text-muted-slate mt-1">Chain ID 5042002</p>
                </div>
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Probe Contract</h4>
                  <p className="text-sm text-slate-300 font-mono break-all">{snapshot.contractAddress}</p>
                  <p className="text-xs text-muted-slate mt-1">Live address from current monitor config</p>
                </div>
                <div className="strict-card p-4">
                  <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Collection Window</h4>
                  <p className="text-sm text-slate-300">10 transactions per burst</p>
                  <p className="text-xs text-muted-slate mt-1">Hourly cadence, zero intentional delay</p>
                </div>
              </div>

              <div className="bg-black border border-strict-border overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-2 bg-strict-border/30 border-b border-strict-border">
                  <span className="text-[10px] font-mono text-muted-slate uppercase tracking-widest">LatencyTest.sol</span>
                  <div className="flex gap-1.5">
                    <div className="size-2 bg-red-900/50"></div>
                    <div className="size-2 bg-yellow-900/50"></div>
                    <div className="size-2 bg-green-900/50"></div>
                  </div>
                </div>
                <pre className="p-6 text-sm font-mono text-emerald-500/80 leading-relaxed overflow-x-auto">
                  <code>{`contract LatencyTest {
    uint256 public counter;

    function increment() public {
        counter++;
    }
}`}</code>
                </pre>
              </div>

              <div className="space-y-3 text-sm list-none border-l border-strict-border pl-6 py-2">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono">▸</span>
                  <span className="text-slate-300">
                    <strong className="text-white">Frequency:</strong> one hourly burst probe.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono">▸</span>
                  <span className="text-slate-300">
                    <strong className="text-white">Sample Size:</strong> 10 back-to-back signed transactions.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono">▸</span>
                  <span className="text-slate-300">
                    <strong className="text-white">Retention:</strong> last 90 days of hourly history
                    ({' '}<code className="text-primary font-mono">2160</code> windows).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono">▸</span>
                  <span className="text-slate-300">
                    <strong className="text-white">Error Handling:</strong> failed or reverted transactions are counted in
                    reliability metrics and excluded from percentile calculations that require successful receipts.
                  </span>
                </div>
              </div>
            </section>

            <section className="border-b border-strict-border pb-12 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-muted-slate">03.</span>
                <h2 className="text-xl uppercase tracking-tight font-bold text-white">Metric Families</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="strict-card p-5">
                  <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-3">Latency</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    The monitor records the elapsed wall-clock time between transaction broadcast and receipt availability.
                    Displayed latency metrics are P50, P95, P99, and average latency per burst.
                  </p>
                  <div className="font-mono text-[11px] bg-black/40 p-3 text-muted-slate border border-strict-border">
                    send_time → receipt_time
                  </div>
                </div>
                <div className="strict-card p-5">
                  <h3 className="text-sm font-mono text-amber-400 uppercase tracking-widest mb-3">Fee Stability</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Effective transaction cost is computed from <code className="text-primary font-mono">gasUsed × effectiveGasPrice</code>,
                    then expressed in native USDC. The dashboard tracks average fee, fee percentiles, spread, volatility,
                    base fee, and gas price context against Arc’s <span className="text-white font-medium">0.01 USDC</span> fee target.
                  </p>
                  <div className="font-mono text-[11px] bg-black/40 p-3 text-muted-slate border border-strict-border">
                    fee_usdc = gasUsed × effectiveGasPrice / 1e18
                  </div>
                </div>
                <div className="strict-card p-5">
                  <h3 className="text-sm font-mono text-emerald-500 uppercase tracking-widest mb-3">Finality & Reliability</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Receipt timing is used as a finality proxy because Arc finality is deterministic. The monitor tracks
                    average / P95 finality time, finalized-under-1s rate, success rate, and observed reorgs.
                  </p>
                  <div className="font-mono text-[11px] bg-black/40 p-3 text-muted-slate border border-strict-border">
                    reorgs = 0, success_rate = successful / total
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-strict-border pb-12 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-mono text-muted-slate">04.</span>
                <h2 className="text-xl uppercase tracking-tight font-bold text-white">Current Snapshot</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {liveRows.map((row) => (
                  <div key={row.label} className="strict-card p-4">
                    <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">{row.label}</h4>
                    <p className="text-sm text-white font-mono break-all">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="strict-card p-4">
                <h4 className="text-[11px] font-bold text-muted-slate uppercase mb-2">Last Update</h4>
                <p className="text-sm text-slate-300 font-mono">{snapshot.updated}</p>
                <p className="text-xs text-muted-slate mt-2">
                  This section is rendered from the current contents of <code className="text-primary font-mono">data/latest.json</code>.
                </p>
              </div>
            </section>

            <section className="mt-12 p-8 border border-strict-border bg-black">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-emerald-500 text-sm">verified_user</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Collector Output</h3>
              </div>
              <p className="text-xs text-muted-slate mb-4 font-mono">
                Each hourly probe writes both a latest snapshot and an append-only history point with this telemetry shape:
              </p>
              <div className="font-mono text-[13px] text-slate-300 space-y-1">
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">1</span>
                  <span><span className="text-purple-400">Latency:</span> <span className="text-emerald-400">p50Ms, p95Ms, p99Ms, avgMs</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">2</span>
                  <span><span className="text-purple-400">Fee:</span> <span className="text-emerald-400">avgUsdc, p50Usdc, p95Usdc, p99Usdc, spreadUsdc</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">3</span>
                  <span><span className="text-purple-400">Gas Context:</span> <span className="text-emerald-400">avgGasPriceGwei, avgGasUsed, avgBaseFeeGwei</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">4</span>
                  <span><span className="text-purple-400">Finality:</span> <span className="text-emerald-400">avgMs, p95Ms, under1sRatePct, reorgsObserved</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">5</span>
                  <span><span className="text-purple-400">Reliability:</span> <span className="text-emerald-400">sampleCount, successfulSamples, failedSamples, successRatePct</span></span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-600 select-none">6</span>
                  <span><span className="text-purple-400">Reference Fee Target:</span> <span className="text-emerald-400">{formatUsdc(snapshot.fee.targetUsdc)} USDC</span></span>
                </div>
              </div>
            </section>

            <footer className="mt-24 pt-8 border-t border-strict-border flex justify-between items-center text-[10px] text-muted-slate font-mono uppercase tracking-widest">
              <div>© 2026 ARC INFRASTRUCTURE</div>
              <div className="flex gap-6">
                <a href="https://twitter.com/0xelegant" className="hover:text-white transition-colors">Contact</a>
                <a href="../latency-test/README.md" className="hover:text-white transition-colors">Benchmark Suite</a>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  )
}
