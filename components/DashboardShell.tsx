'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import LatencyTrendsChart from '@/components/LatencyTrendsChart'
import FeeStabilityChart from '@/components/FeeStabilityChart'
import FinalityPanel from '@/components/FinalityPanel'
import MetricCards from '@/components/MetricCards'
import DataTable from '@/components/DataTable'
import type { TimeInterval } from '@/lib/monitorData'

interface DashboardShellProps {
  generatedAt: string
}

export default function DashboardShell({ generatedAt }: DashboardShellProps) {
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('7d')

  return (
    <div className="flex h-full w-full bg-[var(--bg-deep)]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative lg:ml-0 bg-[var(--bg-deep)]">
        <Header timeInterval={timeInterval} onTimeIntervalChange={setTimeInterval} />
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-3 sm:gap-4">
          <MetricCards />
          <LatencyTrendsChart timeInterval={timeInterval} />
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
            <FeeStabilityChart timeInterval={timeInterval} />
            <FinalityPanel />
          </div>
          <DataTable timeInterval={timeInterval} />
        </div>
        <div className="flex justify-end pt-2 pb-4 sm:pb-6 px-2 sm:px-4">
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-slate uppercase tracking-tight opacity-70">
            SYNC: 12MS | HEARTBEAT: OK
          </span>
        </div>
        <footer className="h-auto sm:h-8 border-t border-strict-border bg-black flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-0 z-10 shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-mono text-muted-slate uppercase mb-2 sm:mb-0">
            <div className="flex items-center gap-2">
              <span className="size-1.5 bg-emerald-500"></span>
              <span className="whitespace-nowrap">ARC NODE SYNC: 100.00%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">query_stats</span>
              <span>RETENTION: 90D</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">signal_cellular_alt</span>
              <span>STATUS</span>
            </div>
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-muted-slate uppercase whitespace-nowrap">
            REPORT GEN UTC: {generatedAt}
          </div>
        </footer>
      </main>
    </div>
  )
}
