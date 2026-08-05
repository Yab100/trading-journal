import { getTrades } from '@/lib/actions/trades'
import { TradeForm } from '@/components/trades/TradeForm'
import { CloseTradeDialog } from '@/components/trades/CloseTradeDialog'
import { DeleteTradeDialog } from '@/components/trades/DeleteTradeDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStrategies } from '@/lib/actions/strategies'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function TradesPage() {
  const trades = await getTrades()
const strategies = await getStrategies()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
          <p className="text-sm text-muted-foreground">
            View, track, and analyze all your executed positions.
          </p>
        </div>

        {/* Updated: explicitly setting data-slot="dialog-trigger" prevents the hydration mismatch */}
        <Dialog>
          <DialogTrigger
            render={
              <Button data-slot="dialog-trigger" className="gap-2">
                <Plus className="h-4 w-4" />
                Log New Trade
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log a New Trade</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <TradeForm strategies={strategies} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Entry Type</TableHead>
              <TableHead className="text-right">Lot Size</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">R:R</TableHead>
              <TableHead className="text-right">P&L ($)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  No trades recorded yet. Click <strong>"Log New Trade"</strong> to add your first position.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const isBuy = trade.type === 'BUY'
                const isOpen = trade.status === 'OPEN'
                const pnlVal = Number(trade.pnl) || 0
                const isWin = pnlVal > 0

                const formattedDate = new Date(trade.entry_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium text-xs text-muted-foreground">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/trades/${trade.id}`}
                        className="text-primary hover:text-primary hover:underline transition-colors"
                      >
                        {trade.symbol}
                      </Link>

                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold'
                        }
                      >
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.timeframe ?? "-"}</TableCell>
                    <TableCell>{trade.strategy ?? "-"}</TableCell>
                    <TableCell>{trade.entryType ?? "-"}</TableCell>
                    <TableCell className="text-right font-mono">{trade.lot_size}</TableCell>
                    <TableCell className="text-right font-mono">{trade.entry_price}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {trade.exit_price ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {trade.risk_reward ? `1:${trade.risk_reward}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {isOpen ? (
                        <span className="text-muted-foreground text-xs italic">Open</span>
                      ) : (
                        <span className={isWin ? 'text-emerald-500' : pnlVal < 0 ? 'text-rose-500' : ''}>
                          {isWin ? '+' : ''}${pnlVal.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOpen ? 'outline' : 'secondary'} className="capitalize text-xs">
                        {trade.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isOpen && <CloseTradeDialog trade={trade} />}
                        <DeleteTradeDialog tradeId={trade.id} symbol={trade.symbol} />
                      </div>
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