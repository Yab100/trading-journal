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
  remainingQuantity: number

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

  partials: {
    id: string
    quantity: number
    remainingQuantity: number
    exitPrice: number
    profitLoss: number
    exitDate: Date
  }[]
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
    entryType: trade.entryType ?? undefined,
    strategy: trade.strategy?.name ?? undefined,
    strategyId: trade.strategyId ?? undefined,
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
    entry_date: trade.entryDate.toISOString(),
    created_at: trade.createdAt.toISOString(),
    closed_at: trade.exitDate?.toISOString() ?? null,
    discipline_rating: trade.discipline_rating ?? undefined,
    execution_rating: trade.execution_rating ?? undefined,
    emotions: trade.emotions ?? [],
    notes: trade.notes ?? undefined,
    partials:
      trade.partials?.map((partial) => ({
        id: partial.id,
        quantity: partial.quantity,
        remainingQuantity: partial.remainingQuantity,
        exitPrice: partial.exitPrice,
        profitLoss: partial.profitLoss,
        exitDate: partial.exitDate.toISOString(),
      })) ?? [],
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
  const trades = await prisma.trade.findMany({
    orderBy: {
      entryDate: 'asc',
    },
  })

  console.table(
    trades.map((t) => ({
      symbol: t.symbol,
      entryDate: t.entryDate,
      exitDate: t.exitDate,
      pnl: t.profitLoss,
    }))
  )

  let runningPnl = 0

  return [
    {
      date: 'Start',
      equity: 0,
      tradePnl: 0,
      symbol: 'ACCOUNT',
    },
    ...trades.map((trade) => {
      runningPnl += Number(trade.profitLoss) || 0

      return {
        date: trade.entryDate.toISOString(),
        equity: runningPnl,
        tradePnl: Number(trade.profitLoss) || 0,
        symbol: trade.symbol,
      }
    }),
  ]
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

    await prisma.tradePartial.create({
      data: {
        tradeId: existingTrade.id,
        quantity: closeQuantity,
        remainingQuantity: Math.max(remainingQuantity, 0),
        exitPrice: input.exit_price,
        profitLoss: input.pnl ?? 0,
      },
    })

    const updatedTrade = await prisma.trade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        remainingQuantity: isFullClose ? 0 : remainingQuantity,

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

export async function getTradeById(id: string) {
  const trade = await prisma.trade.findUnique({
    where: {
      id,
    },
    include: {
      strategy: true,
      partials: {
        orderBy: {
          exitDate: 'desc',
        },
      },
    },
  })

  if (!trade) {
    return null
  }

  return mapTradeRecord(trade)
}

export interface UpdateTradeInput {
  tradeId: string

  entryDate?: Date

  symbol: string
  direction: 'LONG' | 'SHORT'

  timeframe?: string
  entryType?: string

  entryPrice: number
  stopLoss: number
  takeProfit?: number

  strategyId?: string

  notes?: string
}

export async function updateTrade(input: UpdateTradeInput) {
  try {
    await prisma.trade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        symbol: input.symbol,
        direction: input.direction,

        timeframe: input.timeframe,
        entryType: input.entryType as any,

        entryPrice: input.entryPrice,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,

        entryDate: input.entryDate,

        strategyId: input.strategyId,

        notes: input.notes,
      },
    })

    revalidatePath('/')
    revalidatePath('/trades')
    revalidatePath(`/trades/${input.tradeId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: 'Failed to update trade',
    }
  }
}

export async function createPartialExit(input: {
  tradeId: string
  quantity: number
  exitPrice: number
}) {
  try {
    const trade = await prisma.trade.findUnique({
      where: {
        id: input.tradeId,
      },
    })

    if (!trade) {
      return {
        success: false,
        error: "Trade not found",
      }
    }


    if (input.quantity > trade.remainingQuantity) {
      return {
        success: false,
        error: "Quantity exceeds remaining position",
      }
    }


    const profitLoss =
      trade.direction === "LONG"
        ? (input.exitPrice - trade.entryPrice) * input.quantity
        : (trade.entryPrice - input.exitPrice) * input.quantity


    const remainingQuantity =
      trade.remainingQuantity - input.quantity


    await prisma.tradePartial.create({
      data: {
        tradeId: trade.id,
        quantity: input.quantity,
        exitPrice: input.exitPrice,
        profitLoss,
        remainingQuantity,
      },
    })


    await prisma.trade.update({
      where: {
        id: trade.id,
      },
      data: {
        remainingQuantity,
        profitLoss: {
          increment: profitLoss,
        },
        status:
          remainingQuantity === 0
            ? "CLOSED"
            : "OPEN",
      },
    })


    return {
      success: true,
    }

  } catch (error) {
    console.error(error)

    return {
      success: false,
      error: "Failed to create partial exit",
    }
  }
}