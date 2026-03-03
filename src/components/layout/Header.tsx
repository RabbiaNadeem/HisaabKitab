import { useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/store/uiStore'
import { useAuthContext } from '@/contexts/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/reports': 'Reports & Analytics',
  '/goals': 'Savings Goals',
  '/settings': 'Settings',
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (email?.[0] ?? '?').toUpperCase()
}

export function Header() {
  const { theme, toggleTheme } = useUIStore()
  const { user, signOut } = useAuthContext()
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] ?? 'HisaabKitab'
  const fullName = user?.user_metadata?.full_name as string | undefined
  const initials = getInitials(fullName, user?.email)

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      {/* Page title */}
      <h1 className="flex-1 truncate text-base font-semibold text-foreground">
        {title}
      </h1>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="shrink-0"
      >
        {theme === 'dark' ? (
          <Sun className="h-4.5 w-4.5 text-muted-foreground" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-muted-foreground" />
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              {fullName && (
                <span className="text-sm font-medium">{fullName}</span>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => signOut()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
