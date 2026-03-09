import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Scale,
  BarChart3,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/',             icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight   },
  { label: 'Budgets',      path: '/budgets',      icon: Scale            },
  { label: 'Reports',      path: '/reports',      icon: BarChart3        },
  { label: 'Goals',        path: '/goals',        icon: Target           },
  { label: 'Settings',     path: '/settings',     icon: Settings         },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { pathname } = useLocation()
  const [tooltipsReady, setTooltipsReady] = useState(false)

  // Suppress tooltips during the sidebar open/close animation (300ms)
  useEffect(() => {
    setTooltipsReady(false)
    const t = setTimeout(() => setTooltipsReady(!sidebarOpen), 350)
    return () => clearTimeout(t)
  }, [sidebarOpen])

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-30 flex h-screen flex-col',
          'bg-sidebar border-r border-sidebar-border',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        {/* Logo / Brand */}
        <div
          className={cn(
            'flex items-center py-5 shrink-0',
            sidebarOpen ? 'gap-3 px-5' : 'justify-center px-0',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <img src="/hisaabkitab_logo.png" alt="HisaabKitab" className="h-9 w-9 object-cover" />
          </div>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap',
              sidebarOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0',
            )}
          >
            <p className="text-base font-bold text-sidebar-foreground leading-tight">
              HisaabKitab
            </p>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
              AI-Powered Personal Finance
            </p>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap',
              sidebarOpen ? 'opacity-100 max-h-8 px-1' : 'opacity-0 max-h-0',
            )}
          >
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Menu
            </p>
          </div>

          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Tooltip key={path} delayDuration={300}>
              <TooltipTrigger asChild>
                <NavLink
                  to={path}
                  end={path === '/'}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5',
                    isActive(path)
                      ? 'bg-sidebar-accent text-foreground font-semibold'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive(path) ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap',
                      sidebarOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0',
                    )}
                  >
                    {label}
                  </span>
                  {isActive(path) && sidebarOpen && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </NavLink>
              </TooltipTrigger>
              {tooltipsReady && (
                <TooltipContent side="right" className="font-medium">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="p-2 border-t border-sidebar-border shrink-0">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className={cn(
                  'w-full text-muted-foreground hover:text-foreground',
                  sidebarOpen ? 'justify-start gap-2' : 'justify-center px-0',
                )}
              >
                {sidebarOpen ? (
                  <>
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="text-sm whitespace-nowrap overflow-hidden">Collapse Sidebar</span>
                  </>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            {tooltipsReady && (
              <TooltipContent side="right" className="font-medium">
                Expand Sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </>
  )
}
