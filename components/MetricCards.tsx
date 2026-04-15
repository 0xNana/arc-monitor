'use client'

import { useEffect, useState } from 'react'
import {
  defaultLatestMetrics,
  formatPercent,
  formatUsdc,
  normalizeLatestMetrics,
} from '@/lib/monitorData'

export default function MetricCards() {
  const [stats, setStats] = useState(defaultLatestMetrics)

  useEffect(() => {
    fetch('/api/latest')
      .then((response) => response.json())
      .then((data) => setStats(normalizeLatestMetrics(data)))
      .catch((err) => console.error('Failed to fetch stats:', err))
  }, [])

  const feeSpread = stats.fee.spreadUsdc

  const cards = [
    {
      label: 'Latency P99',
      value: `${stats.latency.p99Ms.toFixed(1)}`,
      unit: 'MS',
      icon: 'bolt',
      tone: 'text-primary',
      barColor: 'bg-primary',
      barWidth: `${Math.min(100, (stats.latency.p99Ms / 2500) * 100)}%`,
    },
    {
      label: 'Avg Fee',
      value: formatUsdc(stats.fee.avgUsdc),
      unit: 'USDC',
      icon: 'payments',
      tone: 'text-amber-400',
      barColor: 'bg-amber-400',
      barWidth: `${Math.min(100, (stats.fee.avgUsdc / Math.max(stats.fee.targetUsdc, 0.0001)) * 100)}%`,
    },
    {
      label: 'Fee Spread',
      value: formatUsdc(feeSpread),
      unit: 'USDC',
      icon: 'show_chart',
      tone: 'text-p95-purple',
      barColor: 'bg-p95-purple',
      barWidth: `${Math.min(100, stats.fee.volatilityPct)}%`,
    },
    {
      label: 'Finalized <1s',
      value: formatPercent(stats.finality.under1sRatePct),
      unit: '%',
      icon: 'verified',
      tone: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      barWidth: `${Math.min(100, stats.finality.under1sRatePct)}%`,
    },
    {
      label: 'Success Rate',
      value: formatPercent(stats.successRatePct),
      unit: '%',
      icon: 'check_circle',
      tone: 'text-emerald-500',
      barColor: 'bg-emerald-500',
      barWidth: `${Math.min(100, stats.successRatePct)}%`,
    },
    {
      label: 'Sample Count',
      value: `${stats.successfulSamples}`,
      unit: `/${stats.sampleCount || 0} TX`,
      icon: 'database',
      tone: 'text-slate-300',
      barColor: 'bg-slate-500',
      barWidth: `${stats.sampleCount ? (stats.successfulSamples / stats.sampleCount) * 100 : 0}%`,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4 auto-rows-auto">
      {cards.map((card) => (
        <div key={card.label} className="strict-card p-3 sm:p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-muted-slate uppercase">{card.label}</span>
            <span className={`material-symbols-outlined text-[14px] ${card.tone}`}>{card.icon}</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {card.value}
            <span className="text-[9px] sm:text-[10px] text-slate-500 ml-1">{card.unit}</span>
          </div>
          <div className="mt-2 h-1 bg-white/5 overflow-hidden">
            <div className={`h-full ${card.barColor}`} style={{ width: card.barWidth }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}
