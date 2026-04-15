'use client'

import { useEffect, useState } from 'react'
import {
  type HistoryPoint,
  type TimeInterval,
  filterHistoryByTimeInterval,
  formatPercent,
  formatTimestampLabel,
  formatUsdc,
  getHealthStatus,
  getStatusTone,
  normalizeHistoryData,
} from '@/lib/monitorData'

interface DataTableProps {
  timeInterval: TimeInterval
}

export default function DataTable({ timeInterval }: DataTableProps) {
  const [data, setData] = useState<HistoryPoint[]>([])

  useEffect(() => {
    fetch('/api/history')
      .then((response) => response.json())
      .then((history) => {
        const normalized = normalizeHistoryData(history)
        const filtered = filterHistoryByTimeInterval(normalized, timeInterval)
        setData(filtered.slice(-10).reverse())
      })
      .catch((err) => console.error('Failed to fetch history:', err))
  }, [timeInterval])

  return (
    <div className="strict-card w-full min-h-[200px] block relative">
      <div className="p-2 sm:p-3 border-b border-strict-border bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
          Aggregate Data Stream
        </span>
        <span className="text-[8px] sm:text-[9px] font-mono text-muted-slate uppercase">
          Latest 10 hourly probe windows in {timeInterval.toUpperCase()}
        </span>
      </div>
      <div className="w-full overflow-x-auto bg-[var(--bg-charcoal)]">
        <table className="w-full text-left text-[10px] sm:text-[11px] min-w-[980px]">
          <thead className="bg-black text-muted-slate uppercase tracking-tighter font-bold border-b border-strict-border">
            <tr>
              <th className="p-2 sm:p-3 font-mono whitespace-nowrap bg-black">Timestamp UTC</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Latency P50</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Latency P99</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Avg Fee</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Fee Spread</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Finalized &lt;1s</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Success</th>
              <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap bg-black">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-strict-border font-mono bg-[var(--bg-charcoal)]">
            {data.length > 0 ? (
              data.map((point, index) => {
                const status = getHealthStatus({
                  successRatePct: point.successRatePct,
                  finalityUnder1sRatePct: point.finalityUnder1sRatePct,
                  feeVolatilityPct: point.feeAvgUsdc ? (point.feeSpreadUsdc / point.feeAvgUsdc) * 100 : 0,
                  latencyP99Ms: point.latencyP99Ms,
                })

                return (
                  <tr key={index} className="hover:bg-white/[0.02] bg-[var(--bg-charcoal)]">
                    <td className="p-2 sm:p-3 text-white font-bold whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {formatTimestampLabel(point.timestamp, point.time)}
                    </td>
                    <td className="p-2 sm:p-3 text-right text-slate-300 whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {point.latencyP50Ms.toFixed(1)}ms
                    </td>
                    <td className="p-2 sm:p-3 text-right text-primary font-bold whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {point.latencyP99Ms.toFixed(1)}ms
                    </td>
                    <td className="p-2 sm:p-3 text-right text-amber-400 whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {formatUsdc(point.feeAvgUsdc)} USDC
                    </td>
                    <td className="p-2 sm:p-3 text-right text-p95-purple whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {formatUsdc(point.feeSpreadUsdc)} USDC
                    </td>
                    <td className="p-2 sm:p-3 text-right text-emerald-500 whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {formatPercent(point.finalityUnder1sRatePct)}%
                    </td>
                    <td className="p-2 sm:p-3 text-right text-slate-300 whitespace-nowrap bg-[var(--bg-charcoal)]">
                      {formatPercent(point.successRatePct)}%
                    </td>
                    <td className="p-2 sm:p-3 text-right whitespace-nowrap bg-[var(--bg-charcoal)]">
                      <span className={`px-1.5 py-0.5 text-[8px] sm:text-[9px] ${getStatusTone(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr className="bg-[var(--bg-charcoal)]">
                <td colSpan={8} className="p-3 text-center text-slate-500 bg-[var(--bg-charcoal)]">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
