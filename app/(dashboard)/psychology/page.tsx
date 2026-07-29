import { getTrades } from '@/lib/actions/trades'
import { LogPsychologyDialog } from '@/components/psychology/LogPsychologyDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Brain, Star, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react'

export const revalidate = 0

export default async function PsychologyPage() {
  const trades = await getTrades()
  console.log(JSON.stringify(trades, null, 2))

  // Analytics calculations
  const tradesWithPsychology = trades.filter((t) => (t as any).discipline_rating)

  const avgDiscipline = tradesWithPsychology.length
    ? (tradesWithPsychology.reduce((acc, t) => acc + ((t as any).discipline_rating || 0), 0) / tradesWithPsychology.length).toFixed(1)
    : 'N/A'

  const avgExecution = tradesWithPsychology.length
    ? (tradesWithPsychology.reduce((acc, t) => acc + ((t as any).execution_rating || 0), 0) / tradesWithPsychology.length).toFixed(1)
    : 'N/A'

  // Compare PnL of Disciplined trades (4-5 stars) vs Low Discipline (1-2 stars)
  const disciplinedTrades = trades.filter((t) => ((t as any).discipline_rating || 0) >= 4)
  const disciplinedPnL = disciplinedTrades.reduce((acc, t) => acc + (Number((t as any).pnl ?? 0) || 0), 0)

  const impulsiveTrades = trades.filter((t) => (t as any).discipline_rating && (t as any).discipline_rating <= 2)
  const impulsivePnL = impulsiveTrades.reduce((acc, t) => acc + (Number((t as any).pnl ?? 0) || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Psychology & Execution</h1>
        <p className="text-sm text-muted-foreground">
          Track mental discipline, identify emotional triggers, and quantify their impact on your trading performance.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Discipline Score</CardTitle>
            <Brain className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              {avgDiscipline} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Plan adherence rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              {avgExecution} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Timing & entry quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplined PnL</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${disciplinedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${disciplinedPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trades with 4-5 Discipline score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impulsive Cost</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${impulsivePnL < 0 ? 'text-rose-500' : ''}`}>
              ${impulsivePnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trades with 1-2 Discipline score</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades Psychology Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">PnL ($)</TableHead>
              <TableHead className="text-center">Discipline</TableHead>
              <TableHead className="text-center">Execution</TableHead>
              <TableHead>Emotions / Tags</TableHead>
              <TableHead>Reflective Notes</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No trades recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const pnlVal = Number((trade as any).pnl ?? 0) || 0
                const isWin = pnlVal > 0

                return (
                  <TableRow key={trade.id}>
                    <TableCell>
  <span className="font-semibold text-foreground">
    {trade.symbol}
  </span>
</TableCell>
                    <TableCell>
  <span className="font-semibold text-foreground">
    {trade.type}
  </span>
</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {trade.status === 'OPEN' ? (
                        <span className="text-muted-foreground text-xs italic">Open</span>
                      ) : (
                        <span className={isWin ? 'text-emerald-500' : pnlVal < 0 ? 'text-rose-500' : ''}>
                          {isWin ? '+' : ''}${pnlVal.toFixed(2)}
                        </span>
                      )}
                    </TableCell>

                    {/* Discipline Score */}
<TableCell className="text-center">
  {(trade as any).discipline_rating !== null && (trade as any).discipline_rating !== undefined ? (
    <span className="font-mono text-sm font-bold text-purple-400">
      {(trade as any).discipline_rating}/5
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>

{/* Execution Rating */}
<TableCell className="text-center">
  {(trade as any).execution_rating !== null && (trade as any).execution_rating !== undefined ? (
    <span className="font-mono text-sm font-bold text-blue-400">
      {(trade as any).execution_rating}/5
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>

<TableCell className="text-center">
  {trade.discipline_rating !== null && trade.discipline_rating !== undefined ? (
    <span className="font-mono text-sm font-bold text-purple-400">
      {trade.discipline_rating}/5
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>

{/* Execution Rating */}
<TableCell className="text-center">
  {trade.execution_rating !== null && trade.execution_rating !== undefined ? (
    <span className="font-mono text-sm font-bold text-blue-400">
      {trade.execution_rating}/5
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>

                    {/* Emotions */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {trade.emotions && trade.emotions.length > 0 ? (
                          trade.emotions.map((emo: string) => (
                            <Badge key={emo} variant="secondary" className="text-[10px]">
                              {emo}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No tags</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {trade.notes || '—'}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <LogPsychologyDialog trade={trade} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}