'use client'
import { dashboardTimeIntervals, type TimeInterval } from '@/lib/monitorData'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  timeInterval?: TimeInterval
  onTimeIntervalChange?: (interval: TimeInterval) => void
}

export default function Header({ timeInterval = '7d', onTimeIntervalChange }: HeaderProps = {}) {
  const pathname = usePathname()
  const pageTitle = pathname === '/methodology' ? 'Methodology' : 'Dashboard'
  const isDashboard = pathname === '/'
  
  return (
    <header className="h-16 border-b border-strict-border flex items-center justify-between pl-12 lg:pl-6 px-3 sm:px-6 bg-black z-10 shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <h2 className="text-slate-100 text-sm sm:text-base lg:text-lg font-bold tracking-tight uppercase leading-none">{pageTitle}</h2>
        </div>
        {isDashboard && (
          <>
            <div className="hidden md:block h-8 w-px bg-strict-border"></div>
            <div className="hidden lg:flex gap-4 items-center">
              <span className="text-slate-500 text-[10px] font-mono tracking-tighter uppercase">Ctx: HOURLY_PROBE</span>
              <span className="text-slate-500 text-[10px] font-mono tracking-tighter uppercase">Scope: ARC_TESTNET</span>
              <span className="text-slate-500 text-[10px] font-mono tracking-tighter uppercase">
                Window: {timeInterval.toUpperCase()}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isDashboard && (
          <div className="flex border border-strict-border bg-[#0a0a0a]">
            {dashboardTimeIntervals.map((interval, index) => (
              <button
                key={interval}
                onClick={() => onTimeIntervalChange?.(interval)}
                aria-pressed={timeInterval === interval}
                className={`px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-bold ${
                  index > 0 ? 'border-l border-strict-border' : ''
                } ${
                  timeInterval === interval
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {interval.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
