'use client'

import { useState, useTransition } from 'react'
import { deleteTrade } from '@/lib/actions/trades'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface DeleteTradeDialogProps {
  tradeId: string
  symbol: string
}

export function DeleteTradeDialog({ tradeId, symbol }: DeleteTradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteTrade(tradeId)
      if (!result.success) {
        setError(result.error || 'Failed to delete trade.')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
  render={
    <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500 hover:text-rose-600">
      Delete
    </Button>
  }
/>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Trade Record?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this <strong>{symbol}</strong> position? This action cannot be undone and will update your dashboard stats.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2.5 text-xs text-red-500 bg-red-500/10 rounded border border-red-500/20">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}