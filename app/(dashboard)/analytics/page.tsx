import { getTrades } from '@/lib/actions/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

export const revalidate = 0

export default async function AnalyticsPage() {
  const trades = await getTrades()
  const closedTrades = trades.filter((t) => t.status !== 'OPEN')

  // Core Math
  const totalClosed = closedTrades.length
  const winningTrades = closedTrades.filter((t) => (Number(t.pnl) || 0) > 0)
  const losingTrades = closedTrades.filter((t) => (Number(t.pnl) || 0) < 0)

  const grossProfit = winningTrades.reduce((acc, t) => acc + Number(t.pnl), 0)
  const grossLoss = Math.abs(
    losingTrades.reduce((acc, t) => acc + Number(t.pnl), 0)
  )

  const netPnL = grossProfit - grossLoss
  const winRate = totalClosed ? (winningTrades.length / totalClosed) * 100 : 0
  const lossRate = 100 - winRate

  const avgWin = winningTrades.length ? grossProfit / winningTrades.length : 0
  const avgLoss = losingTrades.length ? grossLoss / losingTrades.length : 0
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 100 : 0

  // Profit Factor = Gross Profit / Gross Loss
  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0

  // Trade Expectancy ($ per trade average)
  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  const expectancy =
    (winRate / 100) * avgWin - (lossRate / 100) * avgLoss

  // Group performance by symbol
  const symbolStats: Record<
    string,
    { count: number; pnl: number; wins: number; losses: number }
  > = {}

  closedTrades.forEach((t) => {
    const sym = t.symbol.toUpperCase()
    const pnlVal = Number(t.pnl) || 0

    if (!symbolStats[sym]) {
      symbolStats[sym] = { count: 0, pnl: 0, wins: 0, losses: 0 }
    }

    symbolStats[sym].count += 1
    symbolStats[sym].pnl += pnlVal
    if (pnlVal > 0) symbolStats[sym].wins += 1
    if (pnlVal < 0) symbolStats[sym].losses += 1
  })

  const sortedSymbols = Object.entries(symbolStats).sort(
    (a, b) => b[1].pnl - a[1].pnl
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep dive into edge metrics, expectancy, and asset-level performance.
        </p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{winRate.toFixed(1)}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {winningTrades.length}W / {losingTrades.length}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                profitFactor >= 1.5
                  ? 'text-emerald-500'
                  : profitFactor < 1.0
                  ? 'text-rose-500'
                  : 'text-amber-500'
              }`}
            >
              {profitFactor.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {profitFactor >= 1.5 ? 'Strong Edge' : profitFactor < 1 ? 'Negative Edge' : 'Moderate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Expectancy</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                expectancy > 0 ? 'text-emerald-500' : expectancy < 0 ? 'text-rose-500' : ''
              }`}
            >
              {expectancy >= 0 ? '+' : ''}${expectancy.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Avg yield per trade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Avg Win / Loss</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{riskRewardRatio.toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              ${avgWin.toFixed(0)} / ${avgLoss.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              +${grossProfit.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total gains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium">Gross Loss</CardTitle>
            <Award className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-500">
              -${grossLoss.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total losses</p>
          </CardContent>
        </Card>
      </div>

      {/* Symbol Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Asset Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset / Symbol</TableHead>
                <TableHead className="text-center">Total Trades</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
                <TableHead className="text-center">W / L</TableHead>
                <TableHead className="text-right">Net PnL ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSymbols.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No closed trade data available for analysis.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSymbols.map(([symbol, stat]) => {
                  const symWinRate = (stat.wins / stat.count) * 100
                  const isProfit = stat.pnl > 0

                  return (
                    <TableRow key={symbol}>
                      <TableCell className="font-bold">{symbol}</TableCell>
                      <TableCell className="text-center font-mono">{stat.count}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={symWinRate >= 50 ? 'default' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {symWinRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        <span className="text-emerald-500">{stat.wins}W</span> /{' '}
                        <span className="text-rose-500">{stat.losses}L</span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={isProfit ? 'text-emerald-500' : stat.pnl < 0 ? 'text-rose-500' : ''}>
                          {isProfit ? '+' : ''}${stat.pnl.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}