'use client'

import { useEffect, useState } from 'react'
import {
  defaultLatestMetrics,
  type HistoryPoint,
  type TimeInterval,
  filterHistoryByTimeInterval,
  formatUsdc,
  formatXAxisLabel,
  normalizeHistoryData,
  normalizeLatestMetrics,
} from '@/lib/monitorData'

interface FeeStabilityChartProps {
  timeInterval: TimeInterval
}

export default function FeeStabilityChart({ timeInterval }: FeeStabilityChartProps) {
  const [data, setData] = useState<HistoryPoint[]>([])
  const [targetUsdc, setTargetUsdc] = useState(defaultLatestMetrics.fee.targetUsdc)

  useEffect(() => {
    fetch('/api/history')
      .then((response) => response.json())
      .then((history) => {
        const normalized = normalizeHistoryData(history)
        setData(filterHistoryByTimeInterval(normalized, timeInterval))
      })
      .catch((err) => {
        console.error('Failed to fetch fee history:', err)
        setData([])
      })
  }, [timeInterval])

  useEffect(() => {
    fetch('/api/latest')
      .then((response) => response.json())
      .then((latest) => setTargetUsdc(normalizeLatestMetrics(latest).fee.targetUsdc))
      .catch((err) => console.error('Failed to fetch latest fee target:', err))
  }, [])

  const chartWidth = 1000
  const chartHeight = 300
  const maxValue = data.length
    ? Math.max(
        targetUsdc,
        ...data.flatMap((point) => [point.feeAvgUsdc, point.feeP95Usdc])
      ) * 1.2
    : targetUsdc * 1.2

  const getX = (index: number) => {
    if (data.length <= 1) return 0
    return (index / (data.length - 1)) * chartWidth
  }

  const getY = (value: number) => {
    const normalized = maxValue > 0 ? Math.min(value / maxValue, 1) : 0
    return chartHeight - normalized * chartHeight
  }

  const generatePath = (values: number[]) => {
    if (values.length === 0) return ''
    if (values.length === 1) return `M0,${getY(values[0])} L${chartWidth},${getY(values[0])}`

    return values
      .map((value, index) => {
        const x = getX(index)
        const y = getY(value)
        return index === 0 ? `M${x},${y}` : `L${x},${y}`
      })
      .join(' ')
  }

  const avgFeePath = generatePath(data.map((point) => point.feeAvgUsdc))
  const p95FeePath = generatePath(data.map((point) => point.feeP95Usdc))
  const targetPath = `M0,${getY(targetUsdc)} L${chartWidth},${getY(targetUsdc)}`

  return (
    <section className="strict-card flex flex-col min-h-[280px]">
      <div className="p-3 border-b border-strict-border bg-black/20 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
            Fee Stability {timeInterval.toUpperCase()}
          </span>
          <p className="text-[10px] font-mono text-muted-slate uppercase mt-1">
            Avg and P95 tx cost in native USDC
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-muted-slate uppercase">Target</div>
          <div className="text-sm font-mono text-amber-400">{formatUsdc(targetUsdc)} USDC</div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 relative">
        <div className="absolute -left-8 top-1/2 -rotate-90 text-[9px] font-mono text-muted-slate uppercase tracking-widest hidden sm:block">
          Fee_USDC
        </div>
        <div className="w-full h-full border-l border-b border-strict-border relative pr-10 min-h-[220px]">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, index) => (
              <div key={index} className="w-full border-t border-white/[0.03] flex justify-end items-start pr-2 pt-1">
                <span className="text-[8px] font-mono text-slate-500">{formatUsdc(value)}</span>
              </div>
            ))}
          </div>

          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <path d={targetPath} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.8" />
            {avgFeePath && <path d={avgFeePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />}
            {p95FeePath && <path d={p95FeePath} fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.9" />}
          </svg>
        </div>

        <div className="absolute bottom-0 left-4 right-4 border-t border-strict-border pt-1 pr-10">
          <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-slate-500">
            <span>
              {data[0] ? formatXAxisLabel(data[0].timestamp, data[0].time, true) : 'No data'}
            </span>
            <span className="hidden sm:block">
              {data.length > 2
                ? formatXAxisLabel(
                    data[Math.floor(data.length / 2)].timestamp,
                    data[Math.floor(data.length / 2)].time,
                    true
                  )
                : ''}
            </span>
            <span>
              {data.length
                ? formatXAxisLabel(data[data.length - 1].timestamp, data[data.length - 1].time, true)
                : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-strict-border bg-black/10 flex flex-wrap gap-3 text-[10px] font-mono uppercase">
        <span className="flex items-center gap-2 text-slate-400">
          <span className="size-2 bg-[#38bdf8]"></span>
          Avg fee
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          <span className="size-2 bg-p95-purple"></span>
          P95 fee
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          <span className="size-2 bg-amber-400"></span>
          Docs target
        </span>
      </div>
    </section>
  )
}
