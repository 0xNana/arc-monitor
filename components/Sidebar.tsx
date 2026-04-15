'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-40 p-1.5 border border-strict-border bg-black hover:bg-white/5"
        aria-label="Toggle menu"
      >
        <span className="material-symbols-outlined text-white text-lg">menu</span>
      </button>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 lg:top-0 bottom-0 left-0 w-[240px] border-r border-strict-border flex flex-col bg-[var(--bg-deep)] z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-3 sm:px-6 pt-4 pb-4 border-b border-strict-border bg-black shrink-0 flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="material-symbols-outlined text-primary shrink-0">monitoring</span>
            <h1 className="text-white text-sm font-bold tracking-tighter uppercase truncate">
              ARC MONITOR
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white shrink-0 p-1"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-2 custom-scrollbar">
          <div className="px-3 sm:px-6 py-2 text-[9px] font-bold text-muted-slate uppercase tracking-widest opacity-60">
            Network Selection
          </div>
          <nav className="flex flex-col text-[11px] mb-4">
            <a className="flex items-center gap-3 px-3 sm:px-6 py-2 text-slate-500 border-l-2 border-transparent hover:bg-white/5" href="#">
              <span className="material-symbols-outlined text-[16px]">lan</span>
              <span>MAINNET</span>
            </a>
            <a className="flex items-center gap-3 px-3 sm:px-6 py-2 border-l-2 border-primary bg-primary/5 text-primary" href="#">
              <span className="material-symbols-outlined text-[16px]">experiment</span>
              <span>TESTNET</span>
              <span className="ml-auto text-[8px] bg-primary/20 px-1">ACTIVE</span>
            </a>
          </nav>
          
          <div className="border-t border-strict-border/50 pt-2">
            <nav className="flex flex-col text-[11px]">
              <Link 
                href="/" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 sm:px-6 py-2.5 border-l-2 transition-colors ${
                  pathname === '/' 
                    ? 'text-slate-100 border-primary bg-primary/5 font-bold' 
                    : 'text-slate-500 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span className="tracking-widest uppercase">Dashboard</span>
              </Link>
              <Link 
                href="/methodology" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 sm:px-6 py-2.5 border-l-2 transition-colors ${
                  pathname === '/methodology' 
                    ? 'text-slate-100 border-primary bg-primary/5 font-bold' 
                    : 'text-slate-500 border-transparent hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <span className="tracking-widest uppercase">Methodology</span>
              </Link>
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}
