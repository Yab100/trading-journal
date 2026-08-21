import { getTrades } from '@/lib/actions/trades'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Percent,
  Calculator,
  Scale,
  Award,
  Target,
  Clock,
} from 'lucide-react'
import { getTradingSession } from '@/lib/analytics/session'

export const revalidate = 0

type PerformanceStat = {
  count: number
  pnl: number
  wins: number
  losses: number
}

type AnalyticsTrade = {
  status: string
  pnl: number | undefined
  symbol: string
  strategy?: string
  entryType?: string
  timeframe?: string
  type: 'BUY' | 'SELL'
  entry_date: string
}

export default async function AnalyticsPage() {
  const trades = await getTrades()

  
  const closedTrades: AnalyticsTrade[] = trades.filter(
    (t: AnalyticsTrade) => t.status !== 'OPEN'
  )

  // ============================================================
  // CORE METRICS
  // ============================================================

  const totalClosed = closedTrades.length

  const winningTrades = closedTrades.filter(
    (t) => (Number(t.pnl) || 0) > 0
  )

  const losingTrades = closedTrades.filter(
    (t) => (Number(t.pnl) || 0) < 0
  )

  const grossProfit = winningTrades.reduce(
    (acc, t) => acc + (Number(t.pnl) || 0),
    0
  )

  const grossLoss = Math.abs(
    losingTrades.reduce(
      (acc, t) => acc + (Number(t.pnl) || 0),
      0
    )
  )

  const netPnL = grossProfit - grossLoss

  const winRate =
    totalClosed > 0
      ? (winningTrades.length / totalClosed) * 100
      : 0

  const lossRate = 100 - winRate

  const avgWin =
    winningTrades.length > 0
      ? grossProfit / winningTrades.length
      : 0

  const avgLoss =
    losingTrades.length > 0
      ? grossLoss / losingTrades.length
      : 0

  const riskRewardRatio =
    avgLoss > 0
      ? avgWin / avgLoss
      : avgWin > 0
        ? 100
        : 0

  const profitFactor =
    grossLoss > 0
      ? grossProfit / grossLoss
      : grossProfit > 0
        ? 99.9
        : 0

  const expectancy =
    (winRate / 100) * avgWin -
    (lossRate / 100) * avgLoss

  // ============================================================
  // GENERIC PERFORMANCE GROUPING
  // ============================================================

  function addPerformanceStat(
    stats: Record<string, PerformanceStat>,
    key: string,
    pnl: number
  ) {
    if (!stats[key]) {
      stats[key] = {
        count: 0,
        pnl: 0,
        wins: 0,
        losses: 0,
      }
    }

    stats[key].count += 1
    stats[key].pnl += pnl

    if (pnl > 0) {
      stats[key].wins += 1
    }

    if (pnl < 0) {
      stats[key].losses += 1
    }
  }

  // ============================================================
  // ASSET PERFORMANCE
  // ============================================================

  const symbolStats: Record<string, PerformanceStat> = {}

  closedTrades.forEach((trade) => {
    const symbol = trade.symbol?.toUpperCase() || 'UNKNOWN'
    const pnl = Number(trade.pnl) || 0

    addPerformanceStat(symbolStats, symbol, pnl)
  })

  const sortedSymbols = Object.entries(symbolStats).sort(
    (a, b) => b[1].pnl - a[1].pnl
  )

  // ============================================================
  // STRATEGY PERFORMANCE
  // ============================================================

  const strategyStats: Record<string, PerformanceStat> = {}

  closedTrades.forEach((trade) => {
    const strategy =
      trade.strategy?.trim() || 'No Strategy'

    const pnl = Number(trade.pnl) || 0

    addPerformanceStat(strategyStats, strategy, pnl)
  })

  const sortedStrategies = Object.entries(strategyStats).sort(
    (a, b) => b[1].pnl - a[1].pnl
  )

  // ============================================================
  // ENTRY TYPE PERFORMANCE
  // ============================================================

  const entryTypeLabels: Record<string, string> = {
    FLIP: 'Flip',
    BREAK_CURRENT_HL: 'Break of Current H/L',
    BREAK_PREVIOUS_HL: 'Break of Previous H/L',
  }

  const entryTypeStats: Record<string, PerformanceStat> = {}

  closedTrades.forEach((trade) => {
    const rawEntryType = trade.entryType || 'UNKNOWN'

    const entryType =
      entryTypeLabels[rawEntryType] || rawEntryType

    const pnl = Number(trade.pnl) || 0

    addPerformanceStat(entryTypeStats, entryType, pnl)
  })

  const sortedEntryTypes = Object.entries(entryTypeStats).sort(
    (a, b) => b[1].pnl - a[1].pnl
  )

  // ============================================================
  // TIMEFRAME PERFORMANCE
  // ============================================================

  const timeframeStats: Record<string, PerformanceStat> = {}

  closedTrades.forEach((trade) => {
    const timeframe =
      trade.timeframe?.trim() || 'No Timeframe'

    const pnl = Number(trade.pnl) || 0

    addPerformanceStat(timeframeStats, timeframe, pnl)
  })

  const timeframeOrder = [
    'M1',
    'M5',
    'M15',
    'M30',
    'H1',
    'H4',
    'D1',
    'W1',
    'MN1',
  ]

  const sortedTimeframes = Object.entries(timeframeStats).sort(
    (a, b) => {
      const indexA = timeframeOrder.indexOf(a[0])
      const indexB = timeframeOrder.indexOf(b[0])

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }

      if (indexA !== -1) {
        return -1
      }

      if (indexB !== -1) {
        return 1
      }

      return b[1].pnl - a[1].pnl
    }
  )

  // ============================================================
// BUY vs SELL PERFORMANCE
// ============================================================

const directionStats: Record<string, PerformanceStat> = {}

closedTrades.forEach((trade) => {
  const direction =
    trade.type?.toUpperCase() === 'SELL'
      ? 'SELL'
      : 'BUY'

  const pnl = Number(trade.pnl) || 0

  addPerformanceStat(directionStats, direction, pnl)
})

const directionOrder = ['BUY', 'SELL']

const sortedDirections = Object.entries(directionStats).sort(
  (a, b) => {
    const indexA = directionOrder.indexOf(a[0])
    const indexB = directionOrder.indexOf(b[0])

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    if (indexA !== -1) {
      return -1
    }

    if (indexB !== -1) {
      return 1
    }

    return b[1].pnl - a[1].pnl
  }
)

/// ============================================================
// SESSION PERFORMANCE
// ============================================================

const sessionStats: Record<string, PerformanceStat> = {}

closedTrades.forEach((trade) => {
  const session = getTradingSession(trade.entry_date)
  const pnl = Number(trade.pnl) || 0

  addPerformanceStat(sessionStats, session, pnl)
})

const sessionOrder = [
  'Asia',
  'London',
  'London / New York Overlap',
  'New York',
  'Other',
]

const sortedSessions = Object.entries(sessionStats).sort(
  (a, b) => {
    const indexA = sessionOrder.indexOf(a[0])
    const indexB = sessionOrder.indexOf(b[0])

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    if (indexA !== -1) {
      return -1
    }

    if (indexB !== -1) {
      return 1
    }

    return b[1].pnl - a[1].pnl
  }
)

  // ============================================================
  // PERFORMANCE TABLE COMPONENT
  // ============================================================

  function PerformanceTable({
    rows,
    emptyMessage,
  }: {
    rows: [string, PerformanceStat][]
    emptyMessage: string
  }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">
              Total Trades
            </TableHead>
            <TableHead className="text-center">
              Win Rate
            </TableHead>
            <TableHead className="text-center">
              W / L
            </TableHead>
            <TableHead className="text-right">
              Net PnL ($)
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(([name, stat]) => {
              const rowWinRate =
                stat.count > 0
                  ? (stat.wins / stat.count) * 100
                  : 0

              const isProfit = stat.pnl > 0
              const isLoss = stat.pnl < 0

              return (
                <TableRow key={name}>
                  <TableCell className="font-semibold">
                    {name}
                  </TableCell>

                  <TableCell className="text-center font-mono">
                    {stat.count}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant={
                        rowWinRate >= 50
                          ? 'default'
                          : 'secondary'
                      }
                      className="font-mono text-xs"
                    >
                      {rowWinRate.toFixed(1)}%
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs">
                    <span className="text-emerald-500">
                      {stat.wins}W
                    </span>{' '}
                    /{' '}
                    <span className="text-rose-500">
                      {stat.losses}L
                    </span>
                  </TableCell>

                  <TableCell className="text-right font-mono font-bold">
                    <span
                      className={
                        isProfit
                          ? 'text-emerald-500'
                          : isLoss
                            ? 'text-rose-500'
                            : ''
                      }
                    >
                      {isProfit ? '+' : ''}
                      ${stat.pnl.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    )
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="p-6 space-y-6">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Advanced Analytics
        </h1>

        <p className="text-sm text-muted-foreground">
          Deep dive into edge metrics, expectancy, and
          performance across your trading system.
        </p>
      </div>

      {/* ========================================================
          TOP METRICS
      ======================================================== */}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* WIN RATE */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Win Rate
            </CardTitle>

            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {winRate.toFixed(1)}%
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              {winningTrades.length}W / {losingTrades.length}L
            </p>
          </CardContent>
        </Card>

        {/* PROFIT FACTOR */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Profit Factor
            </CardTitle>

            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                profitFactor >= 1.5
                  ? 'text-emerald-500'
                  : profitFactor < 1
                    ? 'text-rose-500'
                    : 'text-amber-500'
              }`}
            >
              {profitFactor.toFixed(2)}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              {profitFactor >= 1.5
                ? 'Strong Edge'
                : profitFactor < 1
                  ? 'Negative Edge'
                  : 'Moderate'}
            </p>
          </CardContent>
        </Card>

        {/* EXPECTANCY */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Expectancy
            </CardTitle>

            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                expectancy > 0
                  ? 'text-emerald-500'
                  : expectancy < 0
                    ? 'text-rose-500'
                    : ''
              }`}
            >
              {expectancy >= 0 ? '+' : ''}
              ${expectancy.toFixed(2)}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              Avg yield per trade
            </p>
          </CardContent>
        </Card>

        {/* AVG WIN / LOSS */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Avg Win / Loss
            </CardTitle>

            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {riskRewardRatio.toFixed(2)}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              ${avgWin.toFixed(0)} / ${avgLoss.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        {/* GROSS PROFIT */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Gross Profit
            </CardTitle>

            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              +${grossProfit.toFixed(2)}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              Total gains
            </p>
          </CardContent>
        </Card>

        {/* GROSS LOSS */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">
              Gross Loss
            </CardTitle>

            <Award className="h-4 w-4 text-rose-500" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-500">
              -${grossLoss.toFixed(2)}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1">
              Total losses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          NET PNL SUMMARY
      ======================================================== */}

      <Card>
        <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Net PnL
            </p>

            <p
              className={`text-3xl font-bold font-mono ${
                netPnL > 0
                  ? 'text-emerald-500'
                  : netPnL < 0
                    ? 'text-rose-500'
                    : ''
              }`}
            >
              {netPnL >= 0 ? '+' : ''}
              ${netPnL.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Closed Trades
              </p>

              <p className="font-semibold font-mono">
                {totalClosed}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Wins
              </p>

              <p className="font-semibold font-mono text-emerald-500">
                {winningTrades.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Losses
              </p>

              <p className="font-semibold font-mono text-rose-500">
                {losingTrades.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================
          ASSET PERFORMANCE
      ======================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Asset Performance
          </CardTitle>
        </CardHeader>

        <CardContent>
          <PerformanceTable
            rows={sortedSymbols}
            emptyMessage="No closed trade data available for asset analysis."
          />
        </CardContent>
      </Card>

      {/* ========================================================
          STRATEGY + ENTRY TYPE
      ======================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* STRATEGY PERFORMANCE */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Strategy Performance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <PerformanceTable
              rows={sortedStrategies}
              emptyMessage="No closed trade data available for strategy analysis."
            />
          </CardContent>
        </Card>

        {/* ENTRY TYPE PERFORMANCE */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4" />
              Entry Type Performance
            </CardTitle>
          </CardHeader>

          <CardContent>
            <PerformanceTable
              rows={sortedEntryTypes}
              emptyMessage="No closed trade data available for entry type analysis."
            />
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          TIMEFRAME PERFORMANCE
      ======================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeframe Performance
          </CardTitle>

          <p className="text-xs text-muted-foreground">
            Compare trading results across your entry timeframes.
          </p>
        </CardHeader>

        <CardContent>
          <PerformanceTable
            rows={sortedTimeframes}
            emptyMessage="No closed trade data available for timeframe analysis."
          />
        </CardContent>
      </Card>

      {/* ========================================================
    BUY vs SELL PERFORMANCE
======================================================== */}

<Card>
  <CardHeader>
    <CardTitle className="text-base font-semibold flex items-center gap-2">
      <TrendingUp className="h-4 w-4" />
      BUY vs SELL Performance
    </CardTitle>

    <p className="text-xs text-muted-foreground">
      Compare your performance when trading long versus short.
    </p>
  </CardHeader>

  <CardContent>
    <PerformanceTable
      rows={sortedDirections}
      emptyMessage="No closed trade data available for direction analysis."
    />
  </CardContent>
</Card>

{/* ========================================================
    SESSION PERFORMANCE
======================================================== */}

<Card>
  <CardHeader>
    <CardTitle className="text-base font-semibold flex items-center gap-2">
      <Clock className="h-4 w-4" />
      Session Performance
    </CardTitle>

    <p className="text-xs text-muted-foreground">
      Performance calculated from each trade's entry date and time.
    </p>
  </CardHeader>

  <CardContent>
    <PerformanceTable
      rows={sortedSessions}
      emptyMessage="No closed trade data available for session analysis."
    />
  </CardContent>
</Card>

    </div>
  )
}
