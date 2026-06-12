'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type TabItem = { label: string; icon: React.ReactNode; value: string }
type SideBarProps = {
  tabs: TabItem[]
  onSelect: (value: string) => void
}

const SideBar = ({ tabs, onSelect }: SideBarProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleNav = (value: string, index: number) => {
    setSelectedIndex(index)
    onSelect(value)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Dock lateral desktop: expande en hover */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'hidden md:flex flex-col fixed top-0 left-0 h-[100dvh] z-40 py-6 bg-card border-r border-border/80 shadow-[2px_0_20px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-out overflow-hidden',
          isHovered ? 'w-60' : 'w-20'
        )}
      >
        <div className="mb-8 flex items-center gap-3 px-4 shrink-0">
          <div className="w-12 h-12 shrink-0 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-md">
            <img src="/Gymspace-logo-png.png" alt="GYMSPACE" className="w-8 h-auto" />
          </div>
          <span
            className={cn(
              'font-bold tracking-tight whitespace-nowrap transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            GYMSPACE
          </span>
        </div>

        <nav className="flex flex-col gap-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          {tabs.map((tab, index) => {
            const selected = selectedIndex === index
            return (
              <button
                key={tab.value}
                onClick={() => handleNav(tab.value, index)}
                className="relative w-full flex items-center py-1.5 px-4 outline-none group"
                aria-label={tab.label}
                aria-current={selected ? 'page' : undefined}
              >
                {selected && (
                  <span className="absolute left-0 top-[15%] h-[70%] w-1 bg-brand-500 rounded-r" />
                )}
                <span
                  className={cn(
                    'flex items-center h-12 rounded-xl transition-all w-full',
                    selected
                      ? 'bg-brand-50 text-brand-500 dark:bg-accent dark:text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="w-12 shrink-0 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
                    {tab.icon}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold whitespace-nowrap transition-opacity duration-200',
                      isHovered ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    {tab.label}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Dock inferior mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2">
            {tabs.map((tab, index) => {
              const selected = selectedIndex === index
              return (
                <button
                  key={tab.value}
                  onClick={() => handleNav(tab.value, index)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-2.5 transition-colors [&>svg]:w-6 [&>svg]:h-6',
                    selected ? 'text-brand-500' : 'text-muted-foreground'
                  )}
                  aria-label={tab.label}
                  aria-current={selected ? 'page' : undefined}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}

export default SideBar
