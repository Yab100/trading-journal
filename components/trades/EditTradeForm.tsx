'use client'

import { useState, useTransition } from 'react'
import { updateTrade } from '@/lib/actions/trades'
import type { CreateTradeInput } from '@/lib/actions/trades'
import { TradeFields } from './TradeFields'
import { Button } from '@/components/ui/button'

interface EditTradeFormProps {
  trade: any
  strategies: {
    id: string
    name: string
  }[]
  onSuccess?: () => void
}

export function EditTradeForm({
  trade,
  strategies,
  onSuccess,
}: EditTradeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] =
  useState<Partial<CreateTradeInput>>({
    symbol: trade.symbol,
    direction: trade.direction,

    quantity: trade.lot_size,

    timeframe: trade.timeframe || 'M15',
    entryType: trade.entryType || '',

    entryPrice: trade.entry_price,
    stopLoss: trade.stop_loss,
    takeProfit: trade.take_profit,

    strategyId: trade.strategyId || '',
    notes: trade.notes || '',
  })

  const [entryDate, setEntryDate] = useState(
    trade.entry_date
      ? new Date(trade.entry_date)
          .toISOString()
          .slice(0, 16)
      : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateTrade({
        tradeId: trade.id,

        symbol: formData.symbol ?? '',
        direction: formData.direction ?? 'LONG',

        quantity: Number(formData.quantity),

        timeframe: formData.timeframe,
        entryType: formData.entryType,

        entryPrice: Number(formData.entryPrice),
        stopLoss: Number(formData.stopLoss),

        takeProfit: formData.takeProfit
          ? Number(formData.takeProfit)
          : undefined,

        entryDate: entryDate
          ? new Date(entryDate)
          : undefined,

        strategyId:
          formData.strategyId || undefined,

        notes: formData.notes,
      })

      if (!result.success) {
        setError(result.error ?? 'Failed to update trade')
        return
      }

      setSuccess(true)

      onSuccess?.()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-500">
          Trade updated successfully!
        </div>
      )}

      <TradeFields
        formData={formData}
        setFormData={setFormData}
        strategies={strategies}
        showQuantity={true}
      />

      <div>
        <label className="block text-sm font-medium mb-1">
          Entry Date & Time
        </label>

        <input
          type="datetime-local"
          value={entryDate}
          onChange={(e) =>
            setEntryDate(e.target.value)
          }
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending
          ? 'Saving Changes...'
          : 'Save Changes'}
      </Button>
    </form>
  )
}