import { useState } from 'react'
import {
  Palette, Sun, Moon, Save, LogOut,
  Mail, CheckCircle2, AlertCircle, Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAuthContext } from '@/contexts/AuthContext'
import { useUIStore } from '@/store/uiStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (email?.[0] ?? '?').toUpperCase()
}

export default function SettingsPage() {
  const { user, signOut } = useAuthContext()
  const { theme, toggleTheme } = useUIStore()

  const fullName = user?.user_metadata?.full_name as string | undefined
  const initials = getInitials(fullName, user?.email)

  const [displayName, setDisplayName] = useState(fullName ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [signOutOpen, setSignOutOpen] = useState(false)

  async function handleProfileSave() {
    if (!displayName.trim()) return
    setProfileSaving(true)
    setProfileMsg(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() },
    })
    setProfileSaving(false)
    setProfileMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Profile updated successfully.' }
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Profile card ── */}
      <Card className="overflow-hidden">
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0 pb-6 px-6 -mt-8 space-y-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between">
            <Avatar className="h-16 w-16 ring-4 ring-background shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="text-[11px] gap-1 mb-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>

          {/* Name & email read-only display */}
          <div>
            <p className="text-lg font-bold leading-tight">{fullName || displayName || '—'}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
          </div>

          <Separator />

          {/* Edit display name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setProfileMsg(null) }}
              placeholder="Your name"
              className="h-9"
            />
          </div>

          {/* Read-only email */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email Address</Label>
            <Input value={user?.email ?? ''} disabled className="h-9 opacity-60 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          {/* Status message */}
          {profileMsg && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              profileMsg.type === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-green-500/10 text-green-600 dark:text-green-400'
            )}>
              {profileMsg.type === 'error'
                ? <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <Button
            onClick={handleProfileSave}
            disabled={profileSaving || !displayName.trim()}
            size="sm"
            className="gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Appearance</p>
              <p className="text-xs text-muted-foreground">Customize the look and feel</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              {theme === 'dark'
                ? <Moon className="h-4 w-4 text-muted-foreground" />
                : <Sun className="h-4 w-4 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Easy on the eyes at night' : 'Bright and clear view'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none',
                theme === 'dark' ? 'bg-primary' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Danger zone ── */}
      <Card className="border-destructive/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-4.5 w-4.5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold">Account</p>
              <p className="text-xs text-muted-foreground">Manage your session</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">You'll be redirected to the sign-in page.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ── */}
      <div className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/60">HisaabKitab</span>
        <Badge variant="outline" className="text-[10px] py-0 px-1.5">v1.0.0</Badge>
        <span>·</span>
        <span>AI-powered Personal Finance</span>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        description="You'll be signed out and redirected to the login page."
        confirmLabel="Sign Out"
        onConfirm={() => signOut()}
      />
    </div>
  )
}
