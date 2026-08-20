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
import { TradeFilters } from '@/components/trades/TradeFilters'

export const revalidate = 0

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
    direction?: string
    strategyId?: string
    timeframe?: string
    entryType?: string
  }>
}

type Trade = Awaited<ReturnType<typeof getTrades>>[number]

export default async function TradesPage({
  searchParams,
}: Props) {
  const params = await searchParams

  const strategies = await getStrategies()

  const trades = await getTrades({
    search: params.search,
    status: params.status,
    direction: params.direction,
    strategyId: params.strategyId,
    timeframe: params.timeframe,
    entryType: params.entryType,
  })

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Trade History
          </h1>

          <p className="text-sm text-muted-foreground">
            View, track and analyze all of your trades.
          </p>
        </div>

        <Dialog>
          <DialogTrigger
            render={
              <Button
                data-slot="dialog-trigger"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Log New Trade
              </Button>
            }
          />

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Log a New Trade
              </DialogTitle>
            </DialogHeader>

            <div className="pt-4">
              <TradeForm strategies={strategies} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTERS */}

      <TradeFilters strategies={strategies} />

      {/* TABLE */}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[1350px]">
            <TableHeader className="sticky top-0 bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">
                  Date
                </TableHead>

                <TableHead>Symbol</TableHead>

                <TableHead>Direction</TableHead>

                <TableHead>Timeframe</TableHead>

                <TableHead>Strategy</TableHead>

                <TableHead>Entry Type</TableHead>

                <TableHead className="text-right">
                  Lot Size
                </TableHead>

                <TableHead className="text-right">
                  Entry
                </TableHead>

                <TableHead className="text-right">
                  Exit
                </TableHead>

                <TableHead className="text-right">
                  R:R
                </TableHead>

                <TableHead className="text-right">
                  P&amp;L ($)
                </TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="w-[150px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="h-40 text-center text-muted-foreground"
                  >
                    No trades found.
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade: Trade) => {
                  const isBuy = trade.type === 'BUY'
                  const isOpen = trade.status === 'OPEN'

                  const pnlVal =
                    Number(trade.pnl) || 0

                  const isWin = pnlVal > 0

                  const formattedDate =
                    new Date(
                      trade.entry_date
                    ).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )

                  return (
                    <TableRow
                      key={trade.id}
                      className="border-border transition-colors hover:bg-accent/30"
                    >
                      {/* DATE */}

                      <TableCell className="text-xs text-muted-foreground">
                        {formattedDate}
                      </TableCell>

                      {/* SYMBOL */}

                      <TableCell className="font-semibold">
                        <Link
                          href={`/trades/${trade.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {trade.symbol}
                        </Link>
                      </TableCell>

                      {/* DIRECTION */}

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isBuy
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          }
                        >
                          {trade.type}
                        </Badge>
                      </TableCell>

                      {/* TIMEFRAME */}

                      <TableCell>
                        {trade.timeframe ?? '-'}
                      </TableCell>

                      {/* STRATEGY */}

                      <TableCell>
                        {trade.strategy ?? '-'}
                      </TableCell>

                      {/* ENTRY TYPE */}

                      <TableCell>
                        {trade.entryType ?? '-'}
                      </TableCell>

                      {/* LOT SIZE */}

                      <TableCell className="text-right font-mono text-sm">
                        {trade.lot_size}
                      </TableCell>

                      {/* ENTRY */}

                      <TableCell className="text-right font-mono text-sm">
                        {trade.entry_price}
                      </TableCell>

                      {/* EXIT */}

                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {trade.exit_price ?? '-'}
                      </TableCell>

                      {/* R:R */}

                      <TableCell className="text-right font-mono text-sm">
                        {trade.risk_reward
                          ? `1:${trade.risk_reward}`
                          : '-'}
                      </TableCell>

                      {/* PNL */}

                      <TableCell className="text-right font-mono font-semibold">
                        {isOpen ? (
                          <span className="text-xs italic text-muted-foreground">
                            Open
                          </span>
                        ) : (
                          <span
                            className={
                              isWin
                                ? 'text-emerald-500'
                                : pnlVal < 0
                                  ? 'text-rose-500'
                                  : ''
                            }
                          >
                            {isWin ? '+' : ''}$
                            {pnlVal.toFixed(2)}
                          </span>
                        )}
                      </TableCell>

                      {/* STATUS */}

                      <TableCell>
                        <Badge
                          variant={
                            isOpen
                              ? 'outline'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {trade.status.toLowerCase()}
                        </Badge>
                      </TableCell>

                      {/* ACTIONS */}

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isOpen && (
                            <CloseTradeDialog
                              trade={trade}
                            />
                          )}

                          <DeleteTradeDialog
                            tradeId={trade.id}
                            symbol={trade.symbol}
                          />
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
    </div>
  )
}