'use client'

import { useState, useEffect, useTransition } from 'react'
import { getUserSettings, updateUserSettings, UserSettings } from '@/lib/actions/settings'
import { signOut } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Wallet, LogOut, Check } from 'lucide-react'

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<UserSettings>({
    initial_balance: 10000,
    risk_per_trade_pct: 1.0,
    currency: 'USD',
    trade_pairs: ['XAUUSD', 'EURUSD', 'BTCUSD'],
  })
  const [newPair, setNewPair] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    getUserSettings().then(setSettings)
  }, [])

  const handleSave = () => {
    setStatusMsg(null)
    startTransition(async () => {
      const res = await updateUserSettings(settings)
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Settings updated successfully.' })
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update settings.' })
      }
    })
  }

  const addPair = () => {
    if (!newPair.trim()) return
    const formatted = newPair.trim().toUpperCase()
    if (!settings.trade_pairs.includes(formatted)) {
      setSettings((prev) => ({ ...prev, trade_pairs: [...prev.trade_pairs, formatted] }))
    }
    setNewPair('')
  }

  const removePair = (pairToRemove: string) => {
    setSettings((prev) => ({
      ...prev,
      trade_pairs: prev.trade_pairs.filter((p) => p !== pairToRemove),
    }))
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure initial account balance, default risk parameters, and active watchlists.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded border text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}
        >
          {statusMsg.type === 'success' && <Check className="h-4 w-4" />}
          {statusMsg.text}
        </div>
      )}

      {/* Account & Capital Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-400" /> Capital & Risk Limits
          </CardTitle>
          <CardDescription>
            These baseline parameters calibrate win/loss expectations and drawdown metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="balance">Starting Account Balance ($)</Label>
              <Input
                id="balance"
                type="number"
                value={settings.initial_balance}
                onChange={(e) =>
                  setSettings({ ...settings, initial_balance: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk">Target Risk Per Trade (%)</Label>
              <Input
                id="risk"
                type="number"
                step="0.1"
                value={settings.risk_per_trade_pct}
                onChange={(e) =>
                  setSettings({ ...settings, risk_per_trade_pct: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist & Instruments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-400" /> Default Watchlist Pairs
          </CardTitle>
          <CardDescription>Quick-select assets for trade entry dialogs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. GBPJPY, US30"
              value={newPair}
              onChange={(e) => setNewPair(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" variant="secondary" onClick={addPair}>
              Add Pair
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.trade_pairs.map((pair) => (
              <Badge key={pair} variant="outline" className="text-xs px-3 py-1 gap-1.5">
                {pair}
                <button
                  onClick={() => removePair(pair)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Action */}
      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Security & Session */}
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-rose-500">
            <Shield className="h-4 w-4" /> Account Session
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Sign out of your trading journal on this device.
          </p>
          <form action={signOut}>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}