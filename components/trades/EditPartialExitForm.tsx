'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updatePartialExit } from '@/lib/actions/trades'

export function EditPartialExitForm({
  partial,
}: {
  partial: any
}) {
  const [quantity, setQuantity] = useState(partial.quantity)
  const [exitPrice, setExitPrice] = useState(partial.exitPrice)
  const [profitLoss, setProfitLoss] = useState(partial.profitLoss)

  async function save() {
    await updatePartialExit({
      id: partial.id,
      quantity: Number(quantity),
      exitPrice: Number(exitPrice),
      profitLoss: Number(profitLoss),
    })

    window.location.reload()
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">

      <input
        className="border rounded p-2 w-full"
        value={quantity}
        onChange={(e)=>setQuantity(e.target.value)}
      />

      <input
        className="border rounded p-2 w-full"
        value={exitPrice}
        onChange={(e)=>setExitPrice(e.target.value)}
      />

      <input
        className="border rounded p-2 w-full"
        value={profitLoss}
        onChange={(e)=>setProfitLoss(e.target.value)}
      />

      <Button onClick={save}>
        Save Partial Exit
      </Button>

    </div>
  )
}