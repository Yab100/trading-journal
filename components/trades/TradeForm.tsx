'use client'

import { useState, useTransition } from 'react'
import { createTrade, CreateTradeInput } from '@/lib/actions/trades'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStrategies } from '@/lib/actions/strategies'

interface TradeFormProps {
  strategies: {
    id: string
    name: string
  }[]
  onSuccess?: () => void
}

export function TradeForm({ strategies,onSuccess }: TradeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initial state for form fields
  const [formData, setFormData] = useState<Partial<CreateTradeInput>>({
    symbol: 'XAUUSD',
    direction: 'LONG',
    quantity: 0.1,

    timeframe: 'M15',

    entryType: 'MARKET',

    entryPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    exitPrice: undefined,

    strategyId: '',
    notes: '',
    disciplineRating: 3,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Basic validation
    if (!formData.symbol || !formData.entryPrice || !formData.stopLoss || !formData.quantity) {
      setError('Please fill in all required fields (Symbol, Entry, Stop Loss, Lot Size).')
      return
    }

    startTransition(async () => {
      console.log("FORM DATA", formData)
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
      } else {
        setSuccess(true)
        // Reset prices & setup after successful submit
        setFormData((prev) => ({
          ...prev,
          entryPrice: undefined,
          stopLoss: undefined,
          takeProfit: undefined,
          exitPrice: undefined,
          notes: '',
        }))

        if (onSuccess) {
          onSuccess()
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 rounded-md border border-emerald-500/20">
          Trade recorded successfully!
        </div>
      )}

      {/* Symbol & Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Symbol</label>
          <Input
            name="symbol"
            value={formData.symbol || ''}
            onChange={handleChange}
            placeholder="e.g. XAUUSD"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Direction</label>
          <select
            name="direction"
            value={formData.direction || 'LONG'}
            onChange={handleChange}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
            </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Timeframe
        </label>

        <select
          name="timeframe"
          value={formData.timeframe || 'M15'}
          onChange={handleChange}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="M1">M1</option>
          <option value="M5">M5</option>
          <option value="M15">M15</option>
          <option value="M30">M30</option>
          <option value="H1">H1</option>
          <option value="H4">H4</option>
          <option value="D1">D1</option>
          <option value="W1">W1</option>
        </select>
      </div>

      {/* Lot Size & Entry Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Lot Size</label>
          <Input
            type="number"
            step="0.01"
            name="quantity"
            value={formData.quantity ?? ''}
            onChange={handleChange}
            placeholder="0.10"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Entry Price</label>
          <Input
            type="number"
            step="any"
            name="entryPrice"
            value={formData.entryPrice ?? ''}
            onChange={handleChange}
            placeholder="2350.50"
            required
          />
        </div>
      </div>

      {/* Stop Loss & Take Profit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Stop Loss</label>
          <Input
            type="number"
            step="any"
            name="stopLoss"
            value={formData.stopLoss ?? ''}
            onChange={handleChange}
            placeholder="2340.00"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Take Profit (Optional)</label>
          <Input
            type="number"
            step="any"
            name="takeProfit"
            value={formData.takeProfit ?? ''}
            onChange={handleChange}
            placeholder="2370.00"
          />
        </div>
      </div>

      {/* STRATEGY */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Strategy
        </label>

        <select
          name="strategyId"
          value={formData.strategyId || ''}
          onChange={handleChange}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">No Strategy</option>

          {strategies.map((strategy) => (
            <option
              key={strategy.id}
              value={strategy.id}
            >
              {strategy.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">
          Entry Type
        </label>

        <select
          name="entryType"
          value={formData.entryType || 'MARKET'}
          onChange={handleChange}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="MARKET">Break of current H/L</option>
          <option value="LIMIT">Break of previous H/L</option>
          <option value="STOP">Flip</option>
        </select>
</div>

      {/* NOTES */}
      <div>
                <label className="block text-xs font-medium mb-1">Setup / Strategy (Optional)</label>
        <Input
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="e.g. Liquidity Sweep, Fair Value Gap"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving Trade...' : 'Log Trade'}
      </Button>
    </form>
  )
}