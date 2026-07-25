'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreateTradeInput = {
  symbol: string
  type: 'BUY' | 'SELL'
  entry_price: number
  exit_price?: number
  stop_loss: number
  take_profit?: number
  lot_size: number
  pnl?: number
  setup?: string
  psychology_rating?: number
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED'
}

/**
 * Server Action to insert a new trade into Supabase
 */
export async function createTrade(input: CreateTradeInput) {
  try {
    const supabase = await createClient()

    // Get current logged-in user (optional if auth is enabled)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Calculate Risk:Reward ratio if TP and SL are provided
    let riskReward: number | undefined = undefined
    if (input.take_profit && input.stop_loss && input.entry_price) {
      const risk = Math.abs(input.entry_price - input.stop_loss)
      const reward = Math.abs(input.take_profit - input.entry_price)
      if (risk > 0) {
        riskReward = Number((reward / risk).toFixed(2))
      }
    }

    const { data, error } = await supabase
      .from('trades')
      .insert([
        {
          ...input,
          user_id: user?.id ?? null, // Attaches trade to user if authenticated
          risk_reward: riskReward,
          status: input.status || (input.exit_price ? 'CLOSED' : 'OPEN'),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase Insert Error:', error.message)
      return { success: false, error: error.message }
    }

    // Refresh pages that display trades so new data shows immediately
    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true, data }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to save trade.' }
  }
}

/**
 * Server Action to fetch all trades from Supabase
 */
export async function getTrades() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase Fetch Error:', error.message)
    return []
  }

  return data ?? []
}

/**
 * Server Action to compute aggregate analytics for dashboard StatCards
 */
export async function getDashboardStats() {
  const supabase = await createClient()

  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')

  if (error || !trades) {
    return {
      totalTrades: 0,
      openTrades: 0,
      closedTradesCount: 0,
      winningTrades: 0,
      totalPnl: 0,
      winRate: 0,
      avgRiskReward: 0,
    }
  }

  const totalTrades = trades.length
  const openTrades = trades.filter((t) => t.status === 'OPEN').length
  
  // Consider closed trades or trades that have a recorded PnL
  const closedTrades = trades.filter((t) => t.status === 'CLOSED' || t.pnl !== null)
  const closedTradesCount = closedTrades.length

  // Calculate Net P&L across closed positions
  const totalPnl = closedTrades.reduce((acc, trade) => acc + (Number(trade.pnl) || 0), 0)

  // Calculate Win Rate percentage
  const winningTrades = closedTrades.filter((trade) => (Number(trade.pnl) || 0) > 0).length
  const winRate = closedTradesCount > 0 ? (winningTrades / closedTradesCount) * 100 : 0

  // Calculate Average Risk:Reward ratio
  const tradesWithRR = trades.filter((t) => t.risk_reward !== null && t.risk_reward !== undefined)
  const avgRiskReward =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce((acc, t) => acc + Number(t.risk_reward), 0) / tradesWithRR.length
      : 0

  return {
    totalTrades,
    openTrades,
    closedTradesCount,
    winningTrades,
    totalPnl,
    winRate,
    avgRiskReward,
  }
}

/**
 * Server Action to calculate cumulative equity curve points
 */
export async function getEquityCurveData() {
  const supabase = await createClient()

  const { data: trades, error } = await supabase
    .from('trades')
    .select('created_at, closed_at, pnl, symbol')
    .not('pnl', 'is', null)
    .order('created_at', { ascending: true })

  if (error || !trades || trades.length === 0) {
    return []
  }

  let runningPnl = 0

  // Base starting point at $0
  const points = [
    {
      date: 'Start',
      equity: 0,
      tradePnl: 0,
      symbol: 'ACCOUNT',
    },
  ]

  trades.forEach((trade) => {
    const pnlVal = Number(trade.pnl) || 0
    runningPnl += pnlVal

    const dateFormatted = new Date(trade.closed_at || trade.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    points.push({
      date: dateFormatted,
      equity: Number(runningPnl.toFixed(2)),
      tradePnl: pnlVal,
      symbol: trade.symbol,
    })
  })

  return points
}

export type CloseTradeInput = {
  tradeId: string
  exit_price: number
  pnl: number
}

/**
 * Server Action to close an open position with exit price and realized P&L
 */
export async function closeTrade(input: CloseTradeInput) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('trades')
      .update({
        exit_price: input.exit_price,
        pnl: input.pnl,
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
      })
      .eq('id', input.tradeId)
      .select()
      .single()

    if (error) {
      console.error('Supabase Close Trade Error:', error.message)
      return { success: false, error: error.message }
    }

    // Refresh pages that display trades and stats
    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true, data }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to close trade.' }
  }
}

/**
 * Server Action to delete a trade record by ID
 */
export async function deleteTrade(tradeId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)

    if (error) {
      console.error('Supabase Delete Trade Error:', error.message)
      return { success: false, error: error.message }
    }

    // Refresh cached pages so the row disappears immediately
    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to delete trade.' }
  }
}