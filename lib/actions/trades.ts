'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// TYPES
// ============================================================

export type CreateTradeInput = {
  symbol: string
  direction: 'LONG' | 'SHORT'

  market?: 'FOREX' | 'CRYPTO' | 'STOCKS' | 'INDICES' | 'FUTURES'
  timeframe?: string
  session?: 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP'

  entryType?: string

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

// ============================================================
// MAP TRADE RECORD
// ============================================================

function calculateAchievedRiskReward({
  direction,
  entryPrice,
  stopLoss,
  exitPrices,
}: {
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  stopLoss: number
  exitPrices: number[]
}) {
  if (exitPrices.length === 0) {
    return null
  }

  const risk =
    direction === 'LONG'
      ? entryPrice - stopLoss
      : stopLoss - entryPrice

  if (risk <= 0) {
    return null
  }

  const actualExit =
    direction === 'LONG'
      ? Math.max(...exitPrices)
      : Math.min(...exitPrices)

  const reward =
    direction === 'LONG'
      ? actualExit - entryPrice
      : entryPrice - actualExit

  return Number((reward / risk).toFixed(2))
}

function mapTradeRecord(trade: {
  id: string
  symbol: string
  market: string | null
  timeframe: string | null
  session: string | null
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
  remainingQuantity: number | null

  profitLoss: number | null
  status:
    | 'OPEN'
    | 'WIN'
    | 'LOSS'
    | 'BREAKEVEN'
    | 'CLOSED'

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
  const type: 'BUY' | 'SELL' =
    trade.direction === 'LONG'
      ? 'BUY'
      : 'SELL'

  const status =
    trade.status === 'OPEN'
      ? 'OPEN'
      : 'CLOSED'

  // ============================================================
  // ACHIEVED RR
  // ============================================================
  //
  // IMPORTANT:
  // RR is calculated ONLY from ACTUAL exits.
  //
  // TP is intentionally ignored.
  //
  // If there are partial exits:
  //   LONG  -> highest actual exit
  //   SHORT -> lowest actual exit
  //
  // If there are no partial exits:
  //   use the actual trade.exitPrice if available
  //
  // ============================================================

  const actualExitPrices = [
    ...trade.partials.map(
      (partial: {
        exitPrice: number
      }) => partial.exitPrice
    ),
    ...(trade.partials.length === 0 &&
    trade.exitPrice !== null
      ? [trade.exitPrice]
      : []),
  ]

  const achievedRiskReward =
    calculateAchievedRiskReward({
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      exitPrices: actualExitPrices,
    })

  return {
    id: trade.id,
    symbol: trade.symbol,

    market:
      trade.market ?? undefined,

    timeframe:
      trade.timeframe ?? undefined,

    session:
      trade.session ?? undefined,

    direction:
      trade.direction,

    entryType:
      trade.entryType ?? undefined,

    strategy:
      trade.strategy?.name ?? undefined,

    strategyId:
      trade.strategyId ?? undefined,

    type,

    entry_price:
      trade.entryPrice,

    exit_price:
      trade.exitPrice ?? undefined,

    stop_loss:
      trade.stopLoss,

    take_profit:
      trade.takeProfit ?? undefined,

    lot_size:
      trade.quantity,

    remaining_lot_size:
      trade.remainingQuantity ??
      trade.quantity,

    pnl:
      trade.profitLoss ?? undefined,

    setup:
      trade.notes ?? undefined,

    status,

    // IMPORTANT:
    // Do NOT use trade.riskReward here.
    risk_reward:
      achievedRiskReward ?? undefined,

    entry_date:
      trade.entryDate.toISOString(),

    created_at:
      trade.createdAt.toISOString(),

    closed_at:
      trade.exitDate?.toISOString() ?? null,

    discipline_rating:
      trade.discipline_rating ?? undefined,

    execution_rating:
      trade.execution_rating ?? undefined,

    emotions:
      trade.emotions ?? [],

    notes:
      trade.notes ?? undefined,

    partials:
      trade.partials?.map(
        (partial: {
          id: string
          quantity: number
          remainingQuantity: number
          exitPrice: number
          profitLoss: number
          exitDate: Date
        }) => ({
          id: partial.id,
          quantity: partial.quantity,
          remainingQuantity:
            partial.remainingQuantity,
          exitPrice:
            partial.exitPrice,
          profitLoss:
            partial.profitLoss,
          exitDate:
            partial.exitDate.toISOString(),
        })
      ) ?? [],
  }
}

// ============================================================
// MAPPED TRADE TYPE
// ============================================================

type MappedTrade =
  ReturnType<typeof mapTradeRecord>

// ============================================================
// CREATE TRADE
// ============================================================

export async function createTrade(
  input: CreateTradeInput
) {
  try {
    const supabase =
      await createClient()

    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const trade =
      await prisma.trade.create({
        data: {
          userId: user.id,

          symbol:
            input.symbol,

          direction:
            input.direction,

          market:
            input.market ?? null,

          timeframe:
            input.timeframe ?? null,

          session:
            input.session ?? null,

          entryType:
            input.entryType && input.entryType.trim() !== ''
              ? (input.entryType as any)
              : null,

          entryPrice:
            input.entryPrice,

          exitPrice:
            input.exitPrice ??
            null,

          stopLoss:
            input.stopLoss,

          takeProfit:
            input.takeProfit ??
            null,

          quantity:
            input.quantity,

          remainingQuantity:
            input.quantity,

          riskAmount:
            input.riskAmount ??
            null,

          profitLoss:
            input.profitLoss ??
            null,

          status:
            'OPEN',

          strategyId:
            input.strategyId ??
            null,

          notes:
            input.notes ??
            null,

          // No actual exit yet.
          // Therefore achieved RR = null.
          riskReward:
            null,

          discipline_rating:
            input.disciplineRating ??
            null,

          execution_rating:
            input.executionRating ??
            null,

          emotions:
            input.emotions ?? [],
        },

        include: {
          strategy: true,

          partials: true,
        },
      })

    revalidatePath('/trades')

    revalidatePath('/')

    return {
      success: true,
      data:
        mapTradeRecord(trade),
    }
  } catch (err) {
    console.error(
      'Server Action Error:',
      err
    )

    return {
      success: false,
      error:
        'Failed to save trade.',
    }
  }
}

// ============================================================
// GET TRADES
// ============================================================

interface GetTradesFilters {
  search?: string
  status?: string
  direction?: string
  strategyId?: string
  timeframe?: string
  entryType?: string
}

export async function getTrades(
  filters?: GetTradesFilters
): Promise<MappedTrade[]> {
  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    console.log('GET TRADES: NO AUTHENTICATED USER')
    return []
  }

  console.log('GET TRADES: AUTHENTICATED USER FOUND')

  const trades =
    await prisma.trade.findMany({
      where: {
        userId: user.id,

        ...(filters?.search && {
          symbol: {
            contains:
              filters.search,
            mode: 'insensitive',
          },
        }),

        ...(filters?.status && {
          status:
            filters.status as any,
        }),

        ...(filters?.direction && {
          direction:
            filters.direction as any,
        }),

        ...(filters?.strategyId && {
          strategyId:
            filters.strategyId,
        }),

        ...(filters?.timeframe && {
          timeframe:
            filters.timeframe,
        }),

        ...(filters?.entryType && {
          entryType:
            filters.entryType as any,
        }),
      },

      include: {
        strategy: true,

        partials: {
          orderBy: {
            exitDate: 'asc',
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    })

  return trades.map(
    mapTradeRecord
  )
}

// ============================================================
// DASHBOARD STATS
// ============================================================

type DashboardStats = {
  totalTrades: number
  openTrades: number
  closedTradesCount: number
  winningTrades: number
  totalPnl: number
  winRate: number
  avgRiskReward: number

  bestStrategy: {
    name: string
    trades: number
    wins: number
    pnl: number
  } | null

  bestEntryType: [
    string,
    {
      trades: number
      wins: number
      pnl: number
    }
  ] | null

  strategyStats: {
    name: string
    trades: number
    wins: number
    pnl: number
  }[]

  entryTypeStats: [
    string,
    {
      trades: number
      wins: number
      pnl: number
    }
  ][]
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    console.log('GET TRADES: NO AUTHENTICATED USER')
    return null
  }

  console.log('GET TRADES: AUTHENTICATED USER FOUND')

  const trades =
    await prisma.trade.findMany({  
      where: {
        userId: user.id,
      },

      include: {
        strategy: true,

        partials: {
          orderBy: {
            exitDate: 'asc',
          },
        },
      },
    })

    console.log(
        'GET TRADES: DATABASE RETURNED',
        trades.length,
        'TRADES'
    )

  const mappedTrades: MappedTrade[] =
    trades.map(mapTradeRecord)

  const totalTrades =
    mappedTrades.length

  const openTrades =
    mappedTrades.filter(
      (t) =>
        t.status === 'OPEN'
    ).length

  const closedTrades =
    mappedTrades.filter(
      (t) =>
        t.status === 'CLOSED' ||
        t.pnl !== undefined
    )

  const closedTradesCount =
    closedTrades.length

  const totalPnl =
    closedTrades.reduce(
      (acc, trade) =>
        acc +
        (Number(
          trade.pnl
        ) || 0),
      0
    )

  const winningTrades =
    closedTrades.filter(
      (trade) =>
        (Number(
          trade.pnl
        ) || 0) > 0
    ).length

  const winRate =
    closedTradesCount > 0
      ? (winningTrades /
          closedTradesCount) *
        100
      : 0

  const tradesWithRR =
    mappedTrades.filter(
      (t) =>
        t.risk_reward !==
        undefined
    )

  const avgRiskReward =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce(
          (acc, t) =>
            acc +
            Number(
              t.risk_reward
            ),
          0
        ) /
        tradesWithRR.length
      : 0

  // ==========================================================
  // STRATEGY ANALYTICS
  // ==========================================================

  const strategyStats =
    new Map<
      string,
      {
        name: string
        trades: number
        wins: number
        pnl: number
      }
    >()

  const entryTypeStats =
    new Map<
      string,
      {
        trades: number
        wins: number
        pnl: number
      }
    >()

  for (const trade of trades) {
    if (trade.strategy) {
      const key =
        trade.strategy.id

      if (
        !strategyStats.has(
          key
        )
      ) {
        strategyStats.set(
          key,
          {
            name:
              trade.strategy
                .name,
            trades: 0,
            wins: 0,
            pnl: 0,
          }
        )
      }

      const stat =
        strategyStats.get(
          key
        )!

      stat.trades++

      if (
        (trade.profitLoss ??
          0) > 0
      ) {
        stat.wins++
      }

      stat.pnl +=
        trade.profitLoss ??
        0
    }

    if (trade.entryType) {
      const key =
        trade.entryType

      if (
        !entryTypeStats.has(
          key
        )
      ) {
        entryTypeStats.set(
          key,
          {
            trades: 0,
            wins: 0,
            pnl: 0,
          }
        )
      }

      const stat =
        entryTypeStats.get(
          key
        )!

      stat.trades++

      if (
        (trade.profitLoss ??
          0) > 0
      ) {
        stat.wins++
      }

      stat.pnl +=
        trade.profitLoss ??
        0
    }
  }

  const bestStrategy =
    [...strategyStats.values()]
      .sort(
        (a, b) =>
          b.pnl - a.pnl
      )[0] ?? null

  const bestEntryType =
    [...entryTypeStats.entries()]
      .sort(
        (a, b) =>
          b[1].pnl -
          a[1].pnl
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

    strategyStats: [
      ...strategyStats.values(),
    ],

    entryTypeStats: [
      ...entryTypeStats.entries(),
    ],
  }
}

// ============================================================
// EQUITY CURVE
// ============================================================

export async function getEquityCurveData() {
  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const trades =
    await prisma.trade.findMany({
      where: {
        userId: user.id,
      },

      orderBy: {
        entryDate: 'asc',
      },
    })

  let runningPnl = 0

  return [
    {
      date: 'Start',
      equity: 0,
      tradePnl: 0,
      symbol: 'ACCOUNT',
    },

    ...trades.map(
      (trade: typeof trades[number]) => {
        runningPnl +=
          Number(
            trade.profitLoss
          ) || 0

        return {
          date:
            trade.entryDate.toISOString(),

          equity:
            runningPnl,

          tradePnl:
            Number(
              trade.profitLoss
            ) || 0,

          symbol:
            trade.symbol,
        }
      }
    ),
  ]
}

// ============================================================
// CLOSE TRADE
// ============================================================

export type CloseTradeInput = {
  tradeId: string
  exit_price: number
  pnl: number
  close_quantity?: number
}

/**
 * Close an open position or perform
 * a partial exit.
 *
 * RR is recalculated from ACTUAL exits.
 *
 * Take Profit is NOT used.
 */

export async function closeTrade(
  input: CloseTradeInput
) {
  try {
    const existingTrade =
      await prisma.trade.findUnique({
        where: {
          id: input.tradeId,
        },
      })

    if (!existingTrade) {
      return {
        success: false,
        error:
          'Trade not found.',
      }
    }

    const closeQuantity =
      input.close_quantity ??
      existingTrade.quantity

    const currentRemaining =
      existingTrade.remainingQuantity ??
      existingTrade.quantity

    const remainingQuantity =
      currentRemaining -
      closeQuantity

    const isFullClose =
      remainingQuantity <= 0

    await prisma.tradePartial.create({
      data: {
        tradeId:
          existingTrade.id,

        quantity:
          closeQuantity,

        remainingQuantity:
          Math.max(
            remainingQuantity,
            0
          ),

        exitPrice:
          input.exit_price,

        profitLoss:
          input.pnl ?? 0,
      },
    })

    const allPartials =
      await prisma.tradePartial.findMany({
        where: {
          tradeId:
            existingTrade.id,
        },

        select: {
          exitPrice: true,
        },
      })

    const actualExitPrices =
      allPartials.map(
        (partial: {
          exitPrice: number
        }) =>
          partial.exitPrice
      )

    // Include the actual trade exit
    // as well, if one exists.
    if (
      existingTrade.exitPrice !==
      null
    ) {
      actualExitPrices.push(
        existingTrade.exitPrice
      )
    }

    const riskReward =
      calculateAchievedRiskReward({
        direction:
          existingTrade.direction,

        entryPrice:
          existingTrade.entryPrice,

        stopLoss:
          existingTrade.stopLoss,

        exitPrices:
          actualExitPrices,
      })

    const updatedTrade =
      await prisma.trade.update({
        where: {
          id: input.tradeId,
        },

        data: {
          remainingQuantity:
            isFullClose
              ? 0
              : remainingQuantity,

          exitPrice:
            input.exit_price,

          profitLoss:
            (existingTrade.profitLoss ??
              0) +
            (input.pnl ?? 0),

          riskReward,

          status:
            isFullClose
              ? 'CLOSED'
              : 'OPEN',

          exitDate:
            isFullClose
              ? new Date()
              : null,
        },

        include: {
          strategy: true,

          partials: {
            orderBy: {
              exitDate: 'asc',
            },
          },
        },
      })

    revalidatePath(
      '/trades'
    )

    revalidatePath('/')

    revalidatePath(
      `/trades/${input.tradeId}`
    )

    return {
      success: true,
      data:
        mapTradeRecord(
          updatedTrade
        ),
    }
  } catch (err) {
    console.error(
      'Server Action Error:',
      err
    )

    return {
      success: false,
      error:
        'Failed to close trade.',
    }
  }
}

// ============================================================
// DELETE TRADE
// ============================================================

export async function deleteTrade(
  tradeId: string
) {
  try {
    await prisma.trade.delete({
      where: {
        id: tradeId,
      },
    })

    revalidatePath(
      '/trades'
    )

    revalidatePath('/')

    return {
      success: true,
    }
  } catch (err) {
    console.error(
      'Server Action Error:',
      err
    )

    return {
      success: false,
      error:
        'Failed to delete trade.',
    }
  }
}

// ============================================================
// GET TRADE BY ID
// ============================================================

export async function getTradeById(
  id: string
) {
  const trade =
    await prisma.trade.findUnique({
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

  return mapTradeRecord(
    trade
  )
}

// ============================================================
// UPDATE TRADE
// ============================================================

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

/**
 * Update an existing trade.
 *
 * If Entry, Stop Loss, or Direction changes,
 * achieved RR is recalculated from actual exits.
 *
 * Take Profit is NEVER used for achieved RR.
 */

export async function updateTrade(
  input: UpdateTradeInput
) {
  try {
    const existingTrade =
      await prisma.trade.findUnique({
        where: {
          id: input.tradeId,
        },

        include: {
          partials: {
            select: {
              exitPrice: true,
            },
          },
        },
      })

    if (!existingTrade) {
      return {
        success: false,
        error:
          'Trade not found',
      }
    }

    const actualExitPrices =
      existingTrade.partials.map(
        (partial: {
          exitPrice: number
        }) =>
          partial.exitPrice
      )

    // Also consider the actual
    // trade exit price.
    if (
      existingTrade.exitPrice !==
      null
    ) {
      actualExitPrices.push(
        existingTrade.exitPrice
      )
    }

    const riskReward =
      calculateAchievedRiskReward({
        direction:
          input.direction,

        entryPrice:
          input.entryPrice,

        stopLoss:
          input.stopLoss,

        exitPrices:
          actualExitPrices,
      })

    await prisma.trade.update({
      where: {
        id: input.tradeId,
      },

      data: {
        symbol:
          input.symbol,

        direction:
          input.direction,

        timeframe:
          input.timeframe,

        entryType:
          input.entryType as any,

        entryPrice:
          input.entryPrice,

        stopLoss:
          input.stopLoss,

        takeProfit:
          input.takeProfit,

        entryDate:
          input.entryDate,

        strategyId:
          input.strategyId,

        notes:
          input.notes,

        riskReward,
      },
    })

    revalidatePath('/')

    revalidatePath(
      '/trades'
    )

    revalidatePath(
      `/trades/${input.tradeId}`
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error:
        'Failed to update trade',
    }
  }
}

// ============================================================
// CREATE PARTIAL EXIT
// ============================================================

export async function createPartialExit(
  input: {
    tradeId: string
    quantity: number
    exitPrice: number
  }
) {
  try {
    const trade =
      await prisma.trade.findUnique({
        where: {
          id: input.tradeId,
        },
      })

    if (!trade) {
      return {
        success: false,
        error:
          'Trade not found',
      }
    }

    const currentRemaining =
      trade.remainingQuantity ??
      trade.quantity

    if (
      input.quantity >
      currentRemaining
    ) {
      return {
        success: false,
        error:
          'Quantity exceeds remaining position',
      }
    }

    const profitLoss =
      trade.direction === 'LONG'
        ? (
            input.exitPrice -
            trade.entryPrice
          ) *
          input.quantity
        : (
            trade.entryPrice -
            input.exitPrice
          ) *
          input.quantity

    const remainingQuantity =
      currentRemaining -
      input.quantity

    await prisma.tradePartial.create({
      data: {
        tradeId:
          trade.id,

        quantity:
          input.quantity,

        exitPrice:
          input.exitPrice,

        profitLoss,

        remainingQuantity,
      },
    })

    const allPartials =
      await prisma.tradePartial.findMany({
        where: {
          tradeId:
            trade.id,
        },

        select: {
          exitPrice: true,
        },
      })

    const actualExitPrices =
      allPartials.map(
        (partial: {
          exitPrice: number
        }) =>
          partial.exitPrice
      )

    if (
      trade.exitPrice !==
      null
    ) {
      actualExitPrices.push(
        trade.exitPrice
      )
    }

    const riskReward =
      calculateAchievedRiskReward({
        direction:
          trade.direction,

        entryPrice:
          trade.entryPrice,

        stopLoss:
          trade.stopLoss,

        exitPrices:
          actualExitPrices,
      })

    await prisma.trade.update({
      where: {
        id: trade.id,
      },

      data: {
        remainingQuantity,

        profitLoss: {
          increment:
            profitLoss,
        },

        riskReward,

        status:
          remainingQuantity === 0
            ? 'CLOSED'
            : 'OPEN',

        ...(remainingQuantity ===
          0 && {
          exitPrice:
            input.exitPrice,

          exitDate:
            new Date(),
        }),
      },
    })

    revalidatePath(
      '/trades'
    )

    revalidatePath('/')

    revalidatePath(
      `/trades/${trade.id}`
    )

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error:
        'Failed to create partial exit',
    }
  }
}

// ============================================================
// GET RECENT TRADES
// ============================================================

export async function getRecentTrades() {
  const supabase =
    await createClient()

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const trades =
    await prisma.trade.findMany({
      where: {
        userId: user.id,

        status: {
          not: 'OPEN',
        },
      },

      include: {
        strategy: true,

        partials: {
          orderBy: {
            exitDate: 'asc',
          },
        },
      },

      orderBy: {
        entryDate: 'desc',
      },

      take: 8,
    })

  return trades.map(
    mapTradeRecord
  )
}

// ============================================================
// BIGGEST WINNER
// ============================================================

export async function getBiggestWinner() {
  const trade =
    await prisma.trade.findFirst({
      where: {
        profitLoss: {
          gt: 0,
        },

        status:
          'CLOSED',
      },

      orderBy: {
        profitLoss:
          'desc',
      },

      include: {
        strategy: true,

        partials: {
          orderBy: {
            exitDate: 'asc',
          },
        },
      },
    })

  return trade
    ? mapTradeRecord(trade)
    : null
}

// ============================================================
// BIGGEST LOSER
// ============================================================

export async function getBiggestLoser() {
  const trade =
    await prisma.trade.findFirst({
      where: {
        profitLoss: {
          lt: 0,
        },

        status:
          'CLOSED',
      },

      orderBy: {
        profitLoss:
          'asc',
      },

      include: {
        strategy: true,

        partials: {
          orderBy: {
            exitDate: 'asc',
          },
        },
      },
    })

  return trade
    ? mapTradeRecord(trade)
    : null
}

// ============================================================
// CURRENT WIN STREAK
// ============================================================

export async function getCurrentWinStreak() {
  const trades =
    await prisma.trade.findMany({
      where: {
        status:
          'CLOSED',
      },

      orderBy: {
        exitDate:
          'desc',
      },
    })

  let streak = 0

  for (const trade of trades) {
    if (
      (trade.profitLoss ??
        0) > 0
    ) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ============================================================
// UPDATE PARTIAL EXIT
// ============================================================

/**
 * Update a partial exit.
 *
 * RR is recalculated using actual exit
 * prices after the edit.
 */

export async function updatePartialExit(
  input: {
    id: string
    quantity: number
    exitPrice: number
    profitLoss: number
  }
) {
  try {
    const partial =
      await prisma.tradePartial.update({
        where: {
          id: input.id,
        },

        data: {
          quantity:
            input.quantity,

          exitPrice:
            input.exitPrice,

          profitLoss:
            input.profitLoss,
        },

        include: {
          trade: true,
        },
      })

    const allPartials =
      await prisma.tradePartial.findMany({
        where: {
          tradeId:
            partial.tradeId,
        },

        orderBy: {
          exitDate:
            'asc',
        },
      })

    let remaining =
      partial.trade.quantity

    let totalPnl = 0

    for (const p of allPartials) {
      remaining -=
        p.quantity

      totalPnl +=
        p.profitLoss ?? 0

      await prisma.tradePartial.update({
        where: {
          id: p.id,
        },

        data: {
          remainingQuantity:
            Math.max(
              remaining,
              0
            ),
        },
      })
    }

    const actualExitPrices =
      allPartials.map(
        (p: {
          exitPrice: number
        }) =>
          p.exitPrice
      )

    // Also include the actual
    // Trade.exitPrice if present.
    if (
      partial.trade.exitPrice !==
      null
    ) {
      actualExitPrices.push(
        partial.trade.exitPrice
      )
    }

    const riskReward =
      calculateAchievedRiskReward({
        direction:
          partial.trade
            .direction,

        entryPrice:
          partial.trade
            .entryPrice,

        stopLoss:
          partial.trade
            .stopLoss,

        exitPrices:
          actualExitPrices,
      })

    await prisma.trade.update({
      where: {
        id:
          partial.tradeId,
      },

      data: {
        remainingQuantity:
          Math.max(
            remaining,
            0
          ),

        profitLoss:
          totalPnl,

        riskReward,

        status:
          remaining <= 0
            ? 'CLOSED'
            : 'OPEN',

        ...(remaining <= 0 && {
          exitDate:
            partial.trade
              .exitDate ??
            new Date(),
        }),
      },
    })

    revalidatePath(
      '/trades'
    )

    revalidatePath(
      `/trades/${partial.tradeId}`
    )

    revalidatePath('/')

    return {
      success: true,
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      error:
        'Failed to update partial exit',
    }
  }
}