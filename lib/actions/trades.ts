'use server'

import { prisma } from '@/lib/prisma'
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

function mapTradeRecord(trade: {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
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
  const pnl = trade.profitLoss ?? trade.status === 'WIN' ? 0 : undefined

  return {
    id: trade.id,
    symbol: trade.symbol,
    type,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice ?? undefined,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit ?? undefined,
    lot_size: trade.quantity,
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
    const riskReward = input.take_profit && input.stop_loss && input.entry_price
      ? Number((Math.abs(input.take_profit - input.entry_price) / Math.abs(input.entry_price - input.stop_loss)).toFixed(2))
      : undefined

    const trade = await prisma.trade.create({
      data: {
        userId: '30642e34-91c1-43f0-9018-781462dc215c',
        symbol: input.symbol,
        direction: input.type === 'BUY' ? 'LONG' : 'SHORT',
        entryPrice: input.entry_price,
        exitPrice: input.exit_price ?? null,
        stopLoss: input.stop_loss,
        takeProfit: input.take_profit ?? null,
        quantity: input.lot_size,
        profitLoss: input.pnl ?? null,
        status: input.status === 'CLOSED' ? 'CLOSED' : input.status === 'CANCELLED' ? 'CLOSED' : 'OPEN',
        notes: input.setup ?? null,
        riskReward,
        discipline_rating: input.psychology_rating ?? null,
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
  const trades = await prisma.trade.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return trades.map(mapTradeRecord)
}

/**
 * Server Action to compute aggregate analytics for dashboard StatCards
 */
export async function getDashboardStats() {
  const trades = await prisma.trade.findMany()

  const mappedTrades = trades.map(mapTradeRecord)

  const totalTrades = mappedTrades.length
  const openTrades = mappedTrades.filter((t) => t.status === 'OPEN').length
  const closedTrades = mappedTrades.filter((t) => t.status === 'CLOSED' || t.pnl !== undefined)
  const closedTradesCount = closedTrades.length
  const totalPnl = closedTrades.reduce((acc, trade) => acc + (Number(trade.pnl) || 0), 0)
  const winningTrades = closedTrades.filter((trade) => (Number(trade.pnl) || 0) > 0).length
  const winRate = closedTradesCount > 0 ? (winningTrades / closedTradesCount) * 100 : 0
  const tradesWithRR = mappedTrades.filter((t) => t.risk_reward !== undefined)
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
}

/**
 * Server Action to close an open position with exit price and realized P&L
 */
export async function closeTrade(input: CloseTradeInput) {
  try {
    const trade = await prisma.trade.update({
      where: {
        id: input.tradeId,
      },
      data: {
        exitPrice: input.exit_price,
        profitLoss: input.pnl,
        status: 'CLOSED',
        exitDate: new Date(),
      },
    })

    revalidatePath('/trades')
    revalidatePath('/')

    return { success: true, data: mapTradeRecord(trade) }
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