'use client'
import { useEffect, useState } from 'react'

interface HistoryPoint {
  time: string
  p50: number
  p95: number
  p99: number
}

interface DailyAggregate {
  date: string
  avgP50: number
  avgP95: number
  maxP99: number
  stdDev: number
  samples: number
}

interface DailyAggregatesTableProps {
  timePeriod?: '24h' | '7d' | '30d'
}

export default function DailyAggregatesTable({ timePeriod = '7d' }: DailyAggregatesTableProps) {
  const [aggregates, setAggregates] = useState<DailyAggregate[]>([])

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // Filter data based on time period
          let filteredData = data
          if (timePeriod === '24h') {
            filteredData = data.slice(-24)
          } else if (timePeriod === '7d') {
            filteredData = data.slice(-168)
          } else if (timePeriod === '30d') {
            filteredData = data.slice(-720)
          }
          
          // Group by date and calculate aggregates
          const grouped = groupByDate(filteredData)
          const dailyData = calculateDailyAggregates(grouped)
          setAggregates(dailyData)
        } else {
          setAggregates([])
        }
      })
      .catch(err => {
        console.error('Failed to fetch history:', err)
        setAggregates([])
      })
  }, [timePeriod])

  // Group history points by date
  const groupByDate = (data: HistoryPoint[]): Record<string, HistoryPoint[]> => {
    const grouped: Record<string, HistoryPoint[]> = {}
    
    data.forEach(point => {
      // Since we only have time (HH:MM), group all by current date
      // In future, we should store full ISO timestamps in history.json
      const today = new Date()
      const date = today.toISOString().split('T')[0]
      
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(point)
    })
    
    return grouped
  }

  // Calculate daily aggregates
  const calculateDailyAggregates = (grouped: Record<string, HistoryPoint[]>): DailyAggregate[] => {
    return Object.entries(grouped)
      .map(([date, points]) => {
        const p50Values = points.map(p => p.p50)
        const p95Values = points.map(p => p.p95)
        const p99Values = points.map(p => p.p99)
        
        const avgP50 = p50Values.reduce((a, b) => a + b, 0) / p50Values.length
        const avgP95 = p95Values.reduce((a, b) => a + b, 0) / p95Values.length
        const maxP99 = Math.max(...p99Values)
        
        // Calculate std dev for P50
        const mean = avgP50
        const variance = p50Values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / p50Values.length
        const stdDev = Math.sqrt(variance)
        
        return {
          date,
          avgP50: Math.round(avgP50 * 10) / 10,
          avgP95: Math.round(avgP95 * 10) / 10,
          maxP99: Math.round(maxP99 * 10) / 10,
          stdDev: Math.round(stdDev * 10) / 10,
          samples: points.length
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
      .slice(0, 7) // Last 7 days
  }

  return (
    <div className="strict-card overflow-hidden">
      <div className="p-2 sm:p-3 border-b border-strict-border bg-black/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Aggregates</span>
        <button className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-primary hover:underline">
          <span className="material-symbols-outlined text-[11px] sm:text-[12px]">download</span> Export Data
        </button>
      </div>
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full text-left text-[10px] sm:text-[11px]">
            <thead className="bg-black text-muted-slate uppercase tracking-tighter font-bold border-b border-strict-border">
              <tr>
                <th className="p-2 sm:p-3 font-mono whitespace-nowrap">Date</th>
                <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap">Avg P50</th>
                <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap">Avg P95</th>
                <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap">Max P99</th>
                <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap">Std Dev</th>
                <th className="p-2 sm:p-3 text-right font-mono whitespace-nowrap">Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-strict-border font-mono">
              {aggregates.length > 0 ? (
                aggregates.map((agg, index) => (
                  <tr key={index} className="hover:bg-white/[0.02]">
                    <td className="p-2 sm:p-3 text-white font-bold uppercase whitespace-nowrap">{agg.date}</td>
                    <td className="p-2 sm:p-3 text-right text-slate-400 whitespace-nowrap">{agg.avgP50.toFixed(1)}ms</td>
                    <td className="p-2 sm:p-3 text-right text-slate-400 whitespace-nowrap">{agg.avgP95.toFixed(1)}ms</td>
                    <td className="p-2 sm:p-3 text-right text-primary font-bold whitespace-nowrap">{agg.maxP99.toFixed(1)}ms</td>
                    <td className="p-2 sm:p-3 text-right text-slate-500 whitespace-nowrap">±{agg.stdDev.toFixed(1)}</td>
                    <td className="p-2 sm:p-3 text-right text-slate-500 whitespace-nowrap">{agg.samples}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-slate-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
