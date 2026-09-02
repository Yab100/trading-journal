'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UserSettings {
  initial_balance: number
  risk_per_trade_pct: number
  currency: string
  trade_pairs: string[]
}

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const meta = user?.user_metadata || {}

  return {
    initial_balance: meta.initial_balance ?? 10000,
    risk_per_trade_pct: meta.risk_per_trade_pct ?? 1.0,
    currency: meta.currency ?? 'USD',
    trade_pairs: meta.trade_pairs ?? ['XAUUSD', 'EURUSD', 'BTCUSD'],
  }
}

export async function updateUserSettings(settings: UserSettings) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      data: {
        initial_balance: settings.initial_balance,
        risk_per_trade_pct: settings.risk_per_trade_pct,
        currency: settings.currency,
        trade_pairs: settings.trade_pairs,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/analytics')
    return { success: true }
  } catch (err) {
    console.error('Failed to update settings:', err)
    return { success: false, error: 'Failed to update settings.' }
  }
}