'use client'

import { useState, useTransition } from 'react'
import { createTrade, CreateTradeInput } from '@/lib/actions/trades'
import { Button } from '@/components/ui/button'
import { TradeFields } from '@/components/trades/TradeFields'

interface TradeFormProps {
  strategies: {
    id: string
    name: string
  }[]
  onSuccess?: () => void
}

export function TradeForm({
  strategies,
  onSuccess,
}: TradeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<Partial<CreateTradeInput>>({
    symbol: 'XAUUSD',
    direction: 'LONG',
    quantity: 0.1,
    timeframe: 'M15',
    entryType: '',
    entryPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    exitPrice: undefined,
    strategyId: '',
    notes: '',
    disciplineRating: 3,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)
    setSuccess(false)

    if (
      !formData.symbol ||
      !formData.entryPrice ||
      !formData.stopLoss ||
      !formData.quantity
    ) {
      setError(
        'Please fill in all required fields (Symbol, Entry, Stop Loss, Lot Size).'
      )
      return
    }

    startTransition(async () => {
      const result = await createTrade({
        symbol: formData.symbol!,
        direction: formData.direction!,
        timeframe: formData.timeframe,
        entryType: formData.entryType!,
        entryPrice: Number(formData.entryPrice),
        stopLoss: Number(formData.stopLoss),
        takeProfit: formData.takeProfit,
        exitPrice: formData.exitPrice,
        quantity: Number(formData.quantity),
        strategyId: formData.strategyId || undefined,
        notes: formData.notes,
        disciplineRating: formData.disciplineRating,
      })

      if (!result.success) {
        setError(result.error || 'Failed to record trade.')
        return
      }

      setSuccess(true)

      setFormData((prev) => ({
        ...prev,
        entryPrice: undefined,
        stopLoss: undefined,
        takeProfit: undefined,
        exitPrice: undefined,
        notes: '',
      }))

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-500">
          Trade recorded successfully!
        </div>
      )}

      <TradeFields
        formData={formData}
        setFormData={setFormData}
        strategies={strategies}
      />

      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Saving Trade...' : 'Log Trade'}
      </Button>
    </form>
  )
}