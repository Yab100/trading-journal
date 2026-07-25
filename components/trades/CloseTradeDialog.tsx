'use client'

import { useState, useTransition } from 'react'
import { closeTrade } from '@/lib/actions/trades'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CloseTradeDialogProps {
  trade: {
    id: string
    symbol: string
    type: string
    entry_price: number
    lot_size: number
  }
}

export function CloseTradeDialog({ trade }: CloseTradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [exitPrice, setExitPrice] = useState<string>('')
  const [pnl, setPnl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exitPrice || pnl === '') {
      setError('Please enter both Exit Price and Net P&L.')
      return
    }

    startTransition(async () => {
      const result = await closeTrade({
        tradeId: trade.id,
        exit_price: Number(exitPrice),
        pnl: Number(pnl),
      })

      if (!result.success) {
        setError(result.error || 'Failed to close trade.')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-medium"
        >
          Close Position
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Close {trade.symbol} ({trade.type})</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 text-xs text-red-500 bg-red-500/10 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded">
            <div className="flex justify-between">
              <span>Entry Price:</span>
              <span className="font-mono font-medium">{trade.entry_price}</span>
            </div>
            <div className="flex justify-between">
              <span>Lot Size:</span>
              <span className="font-mono font-medium">{trade.lot_size}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Exit Price</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 2365.20"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Net P&L ($)</label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 150.00 or -50.00"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Closing Position...' : 'Confirm & Close'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}