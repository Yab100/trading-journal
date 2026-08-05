'use client'

import { Input } from '@/components/ui/input'
import { CreateTradeInput } from '@/lib/actions/trades'

interface TradeFieldsProps {
  formData: Partial<CreateTradeInput>
  setFormData: React.Dispatch<
    React.SetStateAction<Partial<CreateTradeInput>>
  >
  strategies: {
    id: string
    name: string
  }[]
  showQuantity?: boolean
}

export function TradeFields({
  formData,
  setFormData,
  strategies,
  showQuantity = true,
}: TradeFieldsProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? undefined
            : Number(value)
          : value,
    }))
  }

  return (
    <>
      {/* Symbol & Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            Symbol
          </label>
          <Input
            name="symbol"
            value={formData.symbol || ''}
            onChange={handleChange}
            placeholder="e.g. XAUUSD"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">
            Direction
          </label>

          <select
            name="direction"
            value={formData.direction || 'LONG'}
            onChange={handleChange}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
      </div>

      {/* Timeframe */}
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

  {showQuantity !== false && (
    <div>
      <label className="block text-xs font-medium mb-1">
        Lot Size
      </label>

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
  )}

  <div>
    <label className="block text-xs font-medium mb-1">
      Entry Price
    </label>

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
          <label className="block text-xs font-medium mb-1">
            Stop Loss
          </label>

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
          <label className="block text-xs font-medium mb-1">
            Take Profit (Optional)
          </label>

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

      {/* Strategy */}
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

      {/* Entry Type */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Entry Type
        </label>

        <select
          name="entryType"
          value={formData.entryType || ''}
          onChange={handleChange}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Select Entry Type</option>
          <option value="BREAK_CURRENT_HL">Break of current H/L</option>
          <option value="BREAK_PREVIOUS_HL">Break of previous H/L</option>
          <option value="FLIP">Flip</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Setup / Strategy (Optional)
        </label>

        <Input
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="e.g. Liquidity Sweep, Fair Value Gap"
        />
      </div>
    </>
  )
}