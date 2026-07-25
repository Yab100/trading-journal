'use client'

import { useState, useTransition } from 'react'
import { createTrade, CreateTradeInput } from '@/lib/actions/trades'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TradeFormProps {
  onSuccess?: () => void
}

export function TradeForm({ onSuccess }: TradeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initial state for form fields
  const [formData, setFormData] = useState<Partial<CreateTradeInput>>({
    symbol: 'XAUUSD',
    type: 'BUY',
    lot_size: 0.1,
    entry_price: undefined,
    stop_loss: undefined,
    take_profit: undefined,
    exit_price: undefined,
    setup: '',
    psychology_rating: 3,
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
    if (!formData.symbol || !formData.entry_price || !formData.stop_loss || !formData.lot_size) {
      setError('Please fill in all required fields (Symbol, Entry, Stop Loss, Lot Size).')
      return
    }

    startTransition(async () => {
      const result = await createTrade({
        symbol: formData.symbol!,
        type: (formData.type as 'BUY' | 'SELL') || 'BUY',
        entry_price: Number(formData.entry_price),
        stop_loss: Number(formData.stop_loss),
        take_profit: formData.take_profit ? Number(formData.take_profit) : undefined,
        exit_price: formData.exit_price ? Number(formData.exit_price) : undefined,
        lot_size: Number(formData.lot_size),
        setup: formData.setup || undefined,
        psychology_rating: formData.psychology_rating ? Number(formData.psychology_rating) : undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to record trade.')
      } else {
        setSuccess(true)
        // Reset prices & setup after successful submit
        setFormData((prev) => ({
          ...prev,
          entry_price: undefined,
          stop_loss: undefined,
          take_profit: undefined,
          exit_price: undefined,
          setup: '',
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
            name="type"
            value={formData.type || 'BUY'}
            onChange={handleChange}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="BUY" className="bg-background text-foreground">BUY (Long)</option>
            <option value="SELL" className="bg-background text-foreground">SELL (Short)</option>
          </select>
        </div>
      </div>

      {/* Lot Size & Entry Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Lot Size</label>
          <Input
            type="number"
            step="0.01"
            name="lot_size"
            value={formData.lot_size ?? ''}
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
            name="entry_price"
            value={formData.entry_price ?? ''}
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
            name="stop_loss"
            value={formData.stop_loss ?? ''}
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
            name="take_profit"
            value={formData.take_profit ?? ''}
            onChange={handleChange}
            placeholder="2370.00"
          />
        </div>
      </div>

      {/* Setup Strategy */}
      <div>
        <label className="block text-xs font-medium mb-1">Setup / Strategy (Optional)</label>
        <Input
          name="setup"
          value={formData.setup || ''}
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