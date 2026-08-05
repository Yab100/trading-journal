import { getTradeById } from '@/lib/actions/trades'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditTradeForm } from '@/components/trades/EditTradeForm'
import { getStrategies } from '@/lib/actions/strategies'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UploadScreenshotDialog } from '@/components/trades/UploadScreenshotDialog'
import Image from 'next/image'

import {
  getTradeScreenshots,
  getScreenshotUrl,
} from '@/lib/actions/screenshots'
import { ScreenshotCard } from '@/components/trades/ScreenshotCard'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function TradeDetailsPage({ params }: Props) {
  const { id } = await params

  const trade = await getTradeById(id)

  const screenshots = await getTradeScreenshots(id)

  const screenshotData = await Promise.all(
    screenshots.map(async (shot) => ({
      ...shot,
      signedUrl: await getScreenshotUrl(shot.url),
    }))
  )
  const strategies = await getStrategies()

  if (!trade) {
    notFound()
  }

  return (
  <div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Link href="/trades">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trades
          </Button>
        </Link>

        <h1 className="text-3xl font-bold">
          {trade.symbol}
        </h1>

        <div className="mt-2 flex gap-2">
          <Badge>{trade.type}</Badge>
          <Badge variant={trade.status === 'OPEN' ? 'outline' : 'secondary'}>
            {trade.status}
          </Badge>
        </div>
      </div>

      <Dialog>
  <DialogTrigger
  render={
    <Button>
      Edit Trade
    </Button>
  }
/>

  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Edit Trade</DialogTitle>
    </DialogHeader>

    <EditTradeForm
      trade={trade}
      strategies={strategies}
    />
  </DialogContent>
</Dialog>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Trade Overview</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Entry Price</span>
            <span>{trade.entry_price}</span>
          </div>

          <div className="flex justify-between">
            <span>Exit Price</span>
            <span>{trade.exit_price ?? "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Stop Loss</span>
            <span>{trade.stop_loss}</span>
          </div>

          <div className="flex justify-between">
            <span>Take Profit</span>
            <span>{trade.take_profit ?? "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Original Size</span>
            <span>{trade.lot_size}</span>
          </div>

          <div className="flex justify-between">
            <span>Remaining Size</span>
            <span>{trade.remaining_lot_size}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>P&L</span>
            <span>${trade.pnl ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Risk : Reward</span>
            <span>
              {trade.risk_reward
                ? `1:${trade.risk_reward}`
                : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Strategy</span>
            <span>{trade.strategy ?? "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Entry Type</span>
            <span>{trade.entryType ?? "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Timeframe</span>
            <span>{trade.timeframe ?? "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Session</span>
            <span>{trade.session ?? "-"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
  <CardHeader>
    <CardTitle>Partial Close History</CardTitle>
  </CardHeader>

  <CardContent>
    {trade.partials.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        No partial closes yet.
      </p>
    ) : (
      <div className="space-y-3">
        {trade.partials.map((partial) => (
          <div
            key={partial.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <div className="font-medium">
                {new Date(partial.exitDate).toLocaleString()}
              </div>

              <div className="text-sm text-muted-foreground">
                Closed {partial.quantity} lots
              </div>
            </div>

            <div className="text-right">
              <div>${partial.exitPrice}</div>

              <div
                className={
                  partial.profitLoss >= 0
                    ? 'text-emerald-500'
                    : 'text-red-500'
                }
              >
                {partial.profitLoss >= 0 ? '+' : ''}
                ${partial.profitLoss.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Trade Notes</CardTitle>
      </CardHeader>

      <CardContent>
        {trade.notes || "No notes added."}
      </CardContent>
    </Card>

    <Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Trade Screenshots</CardTitle>

    <UploadScreenshotDialog tradeId={trade.id} />
  </CardHeader>

  <CardContent>
    {screenshotData.length === 0 ? (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No screenshots uploaded.
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {screenshotData.map((shot) => (
          <ScreenshotCard
            key={shot.id}
            screenshot={shot}
          />
        ))}
      </div>
    )}
  </CardContent>
</Card>
  </div>
)
}