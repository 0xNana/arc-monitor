'use client'

import { useEffect, useState } from 'react'
import {
  defaultLatestMetrics,
  formatPercent,
  getHealthStatus,
  getStatusTone,
  normalizeLatestMetrics,
} from '@/lib/monitorData'

export default function FinalityPanel() {
  const [stats, setStats] = useState(defaultLatestMetrics)

  useEffect(() => {
    fetch('/api/latest')
      .then((response) => response.json())
      .then((data) => setStats(normalizeLatestMetrics(data)))
      .catch((err) => console.error('Failed to fetch finality stats:', err))
  }, [])

  const healthStatus = getHealthStatus({
    successRatePct: stats.successRatePct,
    finalityUnder1sRatePct: stats.finality.under1sRatePct,
    feeVolatilityPct: stats.fee.volatilityPct,
    latencyP99Ms: stats.latency.p99Ms,
  })

  const rows = [
    {
      label: 'Deterministic Finality',
      value: stats.finality.deterministic ? 'Enabled' : 'Unknown',
      tone: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      barWidth: '100%',
    },
    {
      label: 'Finalized <1s',
      value: `${formatPercent(stats.finality.under1sRatePct)}%`,
      tone: 'text-primary',
      barColor: 'bg-primary',
      barWidth: `${Math.min(100, stats.finality.under1sRatePct)}%`,
    },
    {
      label: 'P95 Finality',
      value: `${stats.finality.p95Ms.toFixed(1)}ms`,
      tone: 'text-slate-100',
      barColor: 'bg-slate-100',
      barWidth: `${Math.min(100, (stats.finality.p95Ms / 2500) * 100)}%`,
    },
    {
      label: 'Observed Reorgs',
      value: `${stats.finality.reorgsObserved}`,
      tone: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      barWidth: stats.finality.reorgsObserved === 0 ? '100%' : '20%',
    },
    {
      label: 'Successful Receipts',
      value: `${stats.successfulSamples}/${stats.sampleCount || 0}`,
      tone: 'text-slate-100',
      barColor: 'bg-slate-100',
      barWidth: `${stats.sampleCount ? (stats.successfulSamples / stats.sampleCount) * 100 : 0}%`,
    },
  ]

  return (
    <section className="strict-card flex flex-col min-h-[280px]">
      <div className="p-3 border-b border-strict-border bg-black/20 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
            Finality & Reliability
          </span>
          <p className="text-[10px] font-mono text-muted-slate uppercase mt-1">
            Arc receipts treated as finality events
          </p>
        </div>
        <span className={`px-2 py-1 text-[10px] font-mono uppercase ${getStatusTone(healthStatus)}`}>
          {healthStatus}
        </span>
      </div>

      <div className="flex-1 p-4 grid gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[10px] font-bold text-muted-slate uppercase">{row.label}</span>
              <span className={`text-sm font-mono ${row.tone}`}>{row.value}</span>
            </div>
            <div className="h-1 bg-white/5 overflow-hidden">
              <div className={`h-full ${row.barColor}`} style={{ width: row.barWidth }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-strict-border bg-black/10">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Arc’s docs position finality as deterministic. This panel tracks the operational side of that promise:
          receipt success, finalization speed, and reorg-free execution.
        </p>
      </div>
    </section>
  )
}
