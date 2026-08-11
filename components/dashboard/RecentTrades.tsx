import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  pnl?: number
  status: string
  entry_date: string
}

interface RecentTradesProps {
  trades: Trade[]
}

export function RecentTrades({
  trades,
}: RecentTradesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>

      <CardContent>
        {trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recent trades.
          </p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => {
              const pnl = Number(trade.pnl ?? 0)

              return (
                <Link
                  key={trade.id}
                  href={`/trades/${trade.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {trade.symbol}
                      </span>

                      <Badge variant="outline">
                        {trade.type}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        trade.entry_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div
                    className={`font-semibold ${
                      pnl > 0
                        ? 'text-emerald-500'
                        : pnl < 0
                        ? 'text-rose-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {trade.status === 'OPEN'
                      ? 'Open'
                      : `${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}