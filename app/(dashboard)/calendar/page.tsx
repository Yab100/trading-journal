import Link from 'next/link'
import { getTrades } from '@/lib/actions/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button' // <-- Added buttonVariants
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    year?: string
    month?: string
  }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const today = new Date()
  
  // Parse target year and month (0-indexed for JS Date)
  const selectedYear = params.year ? parseInt(params.year, 10) : today.getFullYear()
  const selectedMonth = params.month ? parseInt(params.month, 10) : today.getMonth()

  const currentMonthDate = new Date(selectedYear, selectedMonth, 1)

  // Navigation dates
  const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1)
  const nextMonthDate = new Date(selectedYear, selectedMonth + 1, 1)

  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long' })

  // Fetch all trades and filter for current month
  const allTrades = await getTrades()

  // Aggregate trades by YYYY-MM-DD
  const dailyStats: Record<string, { pnl: number; tradesCount: number; wins: number; losses: number }> = {}

  allTrades.forEach((trade) => {
    if (!trade.created_at || trade.status === 'OPEN') return
    
    const tradeDate = new Date(trade.entry_date)
    if (tradeDate.getFullYear() === selectedYear && tradeDate.getMonth() === selectedMonth) {
      const dateKey = tradeDate.toISOString().split('T')[0]
      const pnl = Number(trade.pnl) || 0

      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { pnl: 0, tradesCount: 0, wins: 0, losses: 0 }
      }

      dailyStats[dateKey].pnl += pnl
      dailyStats[dateKey].tradesCount += 1
      if (pnl > 0) dailyStats[dateKey].wins += 1
      if (pnl < 0) dailyStats[dateKey].losses += 1
    }
  })

  // Calendar grid calculations
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay()

  // Monthly summary metrics
  const monthlyPnL = Object.values(dailyStats).reduce((acc, curr) => acc + curr.pnl, 0)
  const monthlyTradesCount = Object.values(dailyStats).reduce((acc, curr) => acc + curr.tradesCount, 0)
  const totalTradingDays = Object.keys(dailyStats).length
  const winningDays = Object.values(dailyStats).filter((d) => d.pnl > 0).length
  const losingDays = Object.values(dailyStats).filter((d) => d.pnl < 0).length

  return (
    <div className="p-6 space-y-6">
      {/* Header & Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PnL Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Monthly overview of your daily trading results and performance consistency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Month Link */}
          <Link
            href={`/calendar?year=${prevMonthDate.getFullYear()}&month=${prevMonthDate.getMonth()}`}
            title="Previous Month"
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-md border bg-card font-semibold text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {monthName} {selectedYear}
          </div>

          {/* Next Month Link */}
          <Link
            href={`/calendar?year=${nextMonthDate.getFullYear()}&month=${nextMonthDate.getMonth()}`}
            title="Next Month"
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* Current Month Link */}
          <Link
            href="/calendar"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-2 text-xs" })}
          >
            Current Month
          </Link>
        </div>
      </div>

      {/* Monthly Summary Bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly PnL</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyPnL > 0 ? 'text-emerald-500' : monthlyPnL < 0 ? 'text-rose-500' : ''}`}>
              {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{monthlyTradesCount} closed trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Days</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTradingDays}</div>
            <p className="text-xs text-muted-foreground mt-1">Days with active trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Green Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{winningDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTradingDays ? `${((winningDays / totalTradingDays) * 100).toFixed(0)}% day win rate` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Red Days</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{losingDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTradingDays ? `${((losingDays / totalTradingDays) * 100).toFixed(0)}% day loss rate` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 sm:h-28 rounded-md bg-muted/20 border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const formattedDay = String(dayNum).padStart(2, '0')
              const formattedMonth = String(selectedMonth + 1).padStart(2, '0')
              const dateKey = `${selectedYear}-${formattedMonth}-${formattedDay}`

              const dayData = dailyStats[dateKey]
              const hasTrades = Boolean(dayData)
              const isProfit = dayData && dayData.pnl > 0
              const isLoss = dayData && dayData.pnl < 0

              const isToday =
                today.getFullYear() === selectedYear &&
                today.getMonth() === selectedMonth &&
                today.getDate() === dayNum

              return (
                <div
                  key={dateKey}
                  className={`h-24 sm:h-28 p-2 rounded-md border flex flex-col justify-between transition-colors ${
                    isProfit
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isLoss
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-card border-border/60 hover:border-border'
                  } ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {dayNum}
                    </span>
                    {hasTrades && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-mono">
                        {dayData.tradesCount} {dayData.tradesCount === 1 ? 'trade' : 'trades'}
                      </Badge>
                    )}
                  </div>

                  {hasTrades ? (
                    <div className="space-y-1">
                      <div
                        className={`text-sm sm:text-base font-bold font-mono tracking-tight ${
                          isProfit ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-foreground'
                        }`}
                      >
                        {dayData.pnl >= 0 ? '+' : ''}${dayData.pnl.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex gap-1.5 font-mono">
                        <span className="text-emerald-500">{dayData.wins}W</span>
                        <span className="text-rose-500">{dayData.losses}L</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/40 font-mono">—</div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}