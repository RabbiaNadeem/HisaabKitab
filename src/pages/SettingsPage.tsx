import { useState } from 'react'
import { User, Lock, Palette, ShieldAlert, Sun, Moon, Save, LogOut } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Profile form
  const [displayName, setDisplayName] = useState(fullName ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sign-out confirm
  const [signOutOpen, setSignOutOpen] = useState(false)

  async function handleProfileSave() {
    if (!displayName.trim()) return
    setProfileSaving(true)
    setProfileMsg(null)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() },
    })
    setProfileSaving(false)
    setProfileMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Profile updated.' })
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Profile ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-xs">Update your display name</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{fullName ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          {profileMsg && (
            <p className={cn('text-xs', profileMsg.type === 'error' ? 'text-destructive' : 'text-primary')}>
              {profileMsg.text}
            </p>
          )}

          <Button onClick={handleProfileSave} disabled={profileSaving || !displayName.trim()} size="sm">
            <Save className="h-3.5 w-3.5 mr-2" />
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Appearance ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription className="text-xs">Customize the look and feel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Currently using <span className="font-semibold">{theme === 'dark' ? 'Dark' : 'Light'}</span> mode
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
              {theme === 'dark' ? (
                <><Sun className="h-4 w-4" /> Light Mode</>
              ) : (
                <><Moon className="h-4 w-4" /> Dark Mode</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Security ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription className="text-xs">Change your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          {passwordMsg && (
            <p className={cn('text-xs', passwordMsg.type === 'error' ? 'text-destructive' : 'text-primary')}>
              {passwordMsg.text}
            </p>
          )}

          <Button
            onClick={handlePasswordChange}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            size="sm"
          >
            <Save className="h-3.5 w-3.5 mr-2" />
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Account ── */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldAlert className="h-4.5 w-4.5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription className="text-xs">Sign out of your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">You will be redirected to the sign-in page.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setSignOutOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── App info ── */}
      <div className="text-center text-xs text-muted-foreground pb-4 space-x-2">
        <span>HisaabKitab</span>
        <Badge variant="outline" className="text-[10px] py-0">v1.0.0</Badge>
        <span>· Personal Finance Tracker</span>
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
