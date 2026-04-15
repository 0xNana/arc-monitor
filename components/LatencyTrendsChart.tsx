'use client'

import { useEffect, useState } from 'react'
import {
  type HistoryPoint,
  type TimeInterval,
  filterHistoryByTimeInterval,
  formatXAxisLabel,
  normalizeHistoryData,
} from '@/lib/monitorData'

interface LatencyTrendsChartProps {
  timeInterval: TimeInterval
}

export default function LatencyTrendsChart({ timeInterval }: LatencyTrendsChartProps) {
  const [data, setData] = useState<HistoryPoint[]>([])
  const [activeMetrics, setActiveMetrics] = useState({ p99: true, p95: true, p50: true })

  useEffect(() => {
    fetch('/api/history')
      .then((response) => response.json())
      .then((history) => {
        const normalized = normalizeHistoryData(history)
        setData(filterHistoryByTimeInterval(normalized, timeInterval))
      })
      .catch((err) => {
        console.error('Failed to fetch history:', err)
        setData([])
      })
  }, [timeInterval])

  const maxLatency = data.length
    ? Math.ceil(
        Math.max(
          ...data.flatMap((point) => [
            point.latencyP50Ms,
            point.latencyP95Ms,
            point.latencyP99Ms,
          ])
        ) / 100
      ) * 100
    : 800

  const chartHeight = 400
  const chartWidth = 1000

  const getY = (value: number) => {
    const normalized = Math.min(value / Math.max(maxLatency, 1), 1)
    return chartHeight - normalized * chartHeight
  }

  const getX = (index: number) => {
    if (data.length <= 1) return 0
    return (index / (data.length - 1)) * chartWidth
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

  const p50Path = generatePath(data.map((point) => point.latencyP50Ms))
  const p95Path = generatePath(data.map((point) => point.latencyP95Ms))
  const p99Path = generatePath(data.map((point) => point.latencyP99Ms))

  return (
    <section className="strict-card flex flex-col min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] shrink-0">
      <div className="p-2 sm:p-3 border-b border-strict-border bg-black/20 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Latency Trends {timeInterval.toUpperCase()}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveMetrics({ ...activeMetrics, p99: !activeMetrics.p99 })}
              className={`flex items-center gap-2 px-2 py-1 border ${
                activeMetrics.p99
                  ? 'bg-primary/10 border-primary/30'
                  : 'border-strict-border opacity-40 hover:opacity-100'
              }`}
            >
              <span className="size-2 bg-primary"></span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  activeMetrics.p99 ? 'text-primary' : 'text-slate-500'
                }`}
              >
                P99
              </span>
            </button>
            <button
              onClick={() => setActiveMetrics({ ...activeMetrics, p95: !activeMetrics.p95 })}
              className={`flex items-center gap-2 px-2 py-1 border ${
                activeMetrics.p95
                  ? 'bg-p95-purple/10 border-p95-purple/30'
                  : 'border-strict-border opacity-40 hover:opacity-100'
              }`}
            >
              <span className="size-2 bg-p95-purple"></span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  activeMetrics.p95 ? 'text-p95-purple' : 'text-slate-500'
                }`}
              >
                P95
              </span>
            </button>
            <button
              onClick={() => setActiveMetrics({ ...activeMetrics, p50: !activeMetrics.p50 })}
              className={`flex items-center gap-2 px-2 py-1 border ${
                activeMetrics.p50
                  ? 'bg-p50-slate/10 border-p50-slate/30'
                  : 'border-strict-border opacity-40 hover:opacity-100'
              }`}
            >
              <span className="size-2 bg-p50-slate"></span>
              <span
                className={`text-[10px] font-bold uppercase ${
                  activeMetrics.p50 ? 'text-p50-slate' : 'text-slate-500'
                }`}
              >
                P50
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-muted-slate uppercase">Probe:</span>
          <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-tighter">
            LatencyTest.increment()
          </span>
        </div>
      </div>

      <div className="flex-1 px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8 lg:pb-10 relative flex flex-col min-h-[250px] sm:min-h-[300px] lg:min-h-[350px]">
        <div className="flex-1 relative">
          <div className="absolute -left-10 sm:-left-14 top-1/2 -rotate-90 text-[9px] sm:text-[10px] font-mono text-muted-slate uppercase tracking-widest hidden sm:block">
            Latency_MS
          </div>
          <div className="w-full h-full border-l border-b border-strict-border relative pr-8 sm:pr-10">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[maxLatency, maxLatency * 0.75, maxLatency * 0.5, maxLatency * 0.25, 0].map((value, index) => (
                <div key={index} className="w-full border-t border-white/[0.03] flex justify-end items-start pr-2 pt-1">
                  <span className="text-[8px] font-mono text-slate-500">{Math.round(value)}ms</span>
                </div>
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {activeMetrics.p50 && p50Path && (
                <path d={p50Path} fill="none" opacity="0.6" stroke="var(--p50-slate)" strokeWidth="1.5" />
              )}
              {activeMetrics.p95 && p95Path && (
                <path d={p95Path} fill="none" opacity="0.8" stroke="var(--p95-purple)" strokeWidth="1.5" />
              )}
              {activeMetrics.p99 && p99Path && (
                <path d={p99Path} fill="none" stroke="var(--neon-cyan)" strokeWidth="2.5" />
              )}
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-strict-border pt-1 px-2 sm:px-4 lg:px-6 pr-8 sm:pr-10">
            <div className="flex justify-between items-center w-full">
              {data.length > 0 ? (
                <>
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 whitespace-nowrap">
                    {formatXAxisLabel(data[0].timestamp, data[0].time, true)}
                  </span>
                  {data.length > 2 && (
                    <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 whitespace-nowrap hidden sm:block">
                      {formatXAxisLabel(
                        data[Math.floor(data.length / 2)].timestamp,
                        data[Math.floor(data.length / 2)].time,
                        true
                      )}
                    </span>
                  )}
                  <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 whitespace-nowrap">
                    {formatXAxisLabel(data[data.length - 1].timestamp, data[data.length - 1].time, true)}
                  </span>
                </>
              ) : (
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-500">No data</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
