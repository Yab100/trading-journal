'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CreateTradeInput = {
  symbol: string
  direction: 'LONG' | 'SHORT'

  market?: 'FOREX' | 'CRYPTO' | 'STOCKS' | 'INDICES' | 'FUTURES'
  timeframe?: string
  session?: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP'
  entryType?: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'

  entryPrice: number
  exitPrice?: number

  stopLoss: number
  takeProfit?: number

  quantity: number
  riskAmount?: number

  strategyId?: string

  notes?: string

  disciplineRating?: number
  executionRating?: number
  emotions?: string[]

  profitLoss?: number
}

function mapTradeRecord(trade: {
  id: string
  symbol: string
  market: string | null
  timeframe: string | null
  direction: 'LONG' | 'SHORT'
  entryType: string | null

  strategyId: string | null
  strategy: {
    name: string
  } | null

  entryPrice: number
  exitPrice: number | null
  stopLoss: number
  takeProfit: number | null
  quantity: number

  profitLoss: number | null
  status: 'OPEN' | 'WIN' | 'LOSS' | 'BREAKEVEN' | 'CLOSED'
  entryDate: Date
  exitDate: Date | null
  notes: string | null
  riskReward: number | null
  discipline_rating: number | null
  execution_rating: number | null
  emotions: string[]
  createdAt: Date
}) {
  const type = trade.direction === 'LONG' ? 'BUY' : 'SELL'
  const status = trade.status === 'OPEN' ? 'OPEN' : trade.status === 'CLOSED' ? 'CLOSED' : 'CLOSED'
  const pnl =
  trade.profitLoss ??
  (trade.status === "WIN" ? 0 : undefined)

  return {
    id: trade.id,
    symbol: trade.symbol,
    market: trade.market ?? undefined,
    timeframe: trade.timeframe ?? undefined,
    direction: trade.direction,
   entrytype: trade.entryType ?? undefined,
    strategy: trade.strategy?.name ?? undefined,
    type,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice ?? undefined,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit ?? undefined,
    lot_size: trade.quantity,
    remaining_lot_size: trade.remainingQuantity,
    pnl: trade.profitLoss ?? undefined,
    setup: trade.notes ?? undefined,
    status,
    risk_reward: trade.riskReward ?? undefined,
    created_at: trade.createdAt.toISOString(),
    closed_at: trade.exitDate?.toISOString() ?? null,
    discipline_rating: trade.discipline_rating ?? undefined,
    execution_rating: trade.execution_rating ?? undefined,
    emotions: trade.emotions ?? [],
    notes: trade.notes ?? undefined,
  }
}

/**
 * Server Action to insert a new trade into Supabase
 */
export async function createTrade(input: CreateTradeInput) {
  try {
    const riskReward =
  input.takeProfit &&
  input.stopLoss &&
  input.entryPrice
    ? Number(
        (
          Math.abs(input.takeProfit - input.entryPrice) /
          Math.abs(input.entryPrice - input.stopLoss)
        ).toFixed(2)
      )
    : undefined

    const supabase = await createClient()

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return {
    success: false,
    error: 'Not authenticated',
  }
}

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,

        symbol: input.symbol,
        direction: input.direction,

        market: input.market ?? null,
        timeframe: input.timeframe ?? null,
        session: input.session ?? null,
        entryType: input.entryType ?? null,

        entryPrice: input.entryPrice,
        exitPrice: input.exitPrice ?? null,

        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit ?? null,

        quantity: input.quantity,
        remainingQuantity: input.quantity,
        riskAmount: input.riskAmount ?? null,

        profitLoss: input.profitLoss ?? null,

        status: 'OPEN',

        strategyId: input.strategyId ?? null,

        notes: input.notes ?? null,

        riskReward,

        discipline_rating: input.disciplineRating ?? null,
        execution_rating: input.executionRating ?? null,
        emotions: input.emotions ?? [],
      },
    })

    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true, data: mapTradeRecord(trade) }
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

const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  return []
}

  const trades = await prisma.trade.findMany({
  where: {
    userId: user.id,
  },
  include: {
    strategy: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
})

  const mapped = trades.map(mapTradeRecord)

  
  return mapped
}

/**
 * Server Action to compute aggregate analytics for dashboard StatCards
 */
export async function getDashboardStats() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
    },
    include: {
      strategy: true,
    },
  })

  const mappedTrades = trades.map(mapTradeRecord)

  // =========================
  // Existing Dashboard Stats
  // =========================

  const totalTrades = mappedTrades.length

  const openTrades = mappedTrades.filter(
    (t) => t.status === "OPEN"
  ).length

  const closedTrades = mappedTrades.filter(
    (t) => t.status === "CLOSED" || t.pnl !== undefined
  )

  const closedTradesCount = closedTrades.length

  const totalPnl = closedTrades.reduce(
    (acc, trade) => acc + (Number(trade.pnl) || 0),
    0
  )

  const winningTrades = closedTrades.filter(
    (trade) => (Number(trade.pnl) || 0) > 0
  ).length

  const winRate =
    closedTradesCount > 0
      ? (winningTrades / closedTradesCount) * 100
      : 0

  const tradesWithRR = mappedTrades.filter(
    (t) => t.risk_reward !== undefined
  )

  const avgRiskReward =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce(
          (acc, t) => acc + Number(t.risk_reward),
          0
        ) / tradesWithRR.length
      : 0

  // =========================
  // Strategy Analytics
  // =========================

  const strategyStats = new Map<
    string,
    {
      name: string
      trades: number
      wins: number
      pnl: number
    }
  >()

  const entryTypeStats = new Map<
    string,
    {
      trades: number
      wins: number
      pnl: number
    }
  >()

  for (const trade of trades) {
    // Strategy
    if (trade.strategy) {
      const key = trade.strategy.id

      if (!strategyStats.has(key)) {
        strategyStats.set(key, {
          name: trade.strategy.name,
          trades: 0,
          wins: 0,
          pnl: 0,
        })
      }

      const stat = strategyStats.get(key)!

      stat.trades++

      if ((trade.profitLoss ?? 0) > 0) {
        stat.wins++
      }

      stat.pnl += trade.profitLoss ?? 0
    }

    // Entry Type
    if (trade.entryType) {
      const key = trade.entryType

      if (!entryTypeStats.has(key)) {
        entryTypeStats.set(key, {
          trades: 0,
          wins: 0,
          pnl: 0,
        })
      }

      const stat = entryTypeStats.get(key)!

      stat.trades++

      if ((trade.profitLoss ?? 0) > 0) {
        stat.wins++
      }

      stat.pnl += trade.profitLoss ?? 0
    }
  }

  const bestStrategy =
    [...strategyStats.values()].sort(
      (a, b) => b.pnl - a.pnl
    )[0] ?? null

  const bestEntryType =
    [...entryTypeStats.entries()].sort(
      (a, b) => b[1].pnl - a[1].pnl
    )[0] ?? null

  return {
    totalTrades,
    openTrades,
    closedTradesCount,
    winningTrades,
    totalPnl,
    winRate,
    avgRiskReward,

    bestStrategy,
    bestEntryType,

    strategyStats: [...strategyStats.values()],
    entryTypeStats: [...entryTypeStats.entries()],
  }
}

/**
 * Server Action to calculate cumulative equity curve points
 */
export async function getEquityCurveData() {
  const trades = await prisma.trade.findMany()

  if (trades.length === 0) {
    return []
  }

  let runningPnl = 0

  const points = [
    {
      date: 'Start',
      equity: 0,
      tradePnl: 0,
      symbol: 'ACCOUNT',
    },
  ]

  trades.forEach((trade) => {
    const pnlVal = Number(trade.profitLoss) || 0
    runningPnl += pnlVal

    const dateFormatted = new Date(trade.exitDate || trade.entryDate).toLocaleDateString('en-US', {
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
  close_quantity?: number
}

/**
 * Server Action to close an open position with exit price and realized P&L
 */
export async function closeTrade(input: CloseTradeInput) {
  try {
    const existingTrade = await prisma.trade.findUnique({
      where: {
        id: input.tradeId,
      },
    })

    if (!existingTrade) {
      return {
        success: false,
        error: 'Trade not found.',
      }
    }

    const closeQuantity = input.close_quantity ?? existingTrade.quantity

    const remainingQuantity =
      (existingTrade.remainingQuantity ?? existingTrade.quantity) - closeQuantity

    const isFullClose = remainingQuantity <= 0

    const updatedTrade = await prisma.trade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        remainingQuantity : remainingQuantity,

        exitPrice: input.exit_price,

        profitLoss:
          (existingTrade.profitLoss ?? 0) + (input.pnl ?? 0),

        status: isFullClose ? 'CLOSED' : 'OPEN',

        exitDate: isFullClose ? new Date() : null,
      },
    })

    revalidatePath('/trades')
    revalidatePath('/')

    return {
      success: true,
      data: mapTradeRecord(updatedTrade),
    }

  } catch (err) {
    console.error('Server Action Error:', err)

    return {
      success: false,
      error: 'Failed to close trade.',
    }
  }
}


/**
 * Server Action to delete a trade record by ID
 */
export async function deleteTrade(tradeId: string) {
  try {
    await prisma.trade.delete({
      where: {
        id: tradeId,
      },
    })

    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { success: false, error: 'Failed to delete trade.' }
  }
}