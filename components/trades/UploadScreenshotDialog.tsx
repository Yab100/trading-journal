'use client'

import { useState, useTransition } from 'react'

import { uploadScreenshot } from '@/lib/actions/screenshots'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  tradeId: string
}

export function UploadScreenshotDialog({ tradeId }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<'ENTRY' | 'EXIT' | ''>('')
  const [timeframe, setTimeframe] = useState('')

  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError(null)

    if (!file) {
      setError('Please choose an image.')
      return
    }

    startTransition(async () => {
      const result = await uploadScreenshot({
        tradeId,
        file,
        phase: phase || undefined,
        timeframe: timeframe || undefined,
      })

      if (!result.success) {
        setError(result.error ?? 'Upload failed.')
        return
      }

      setOpen(false)

      setFile(null)
      setPhase('')
      setTimeframe('')
    })
  }

  return (
    
      <>
        <Button onClick={() => setOpen(true)}>
          Add Screenshot
        </Button>
      
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Upload Screenshot
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Screenshot
            </label>

            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Phase (Optional)
            </label>

            <select
              value={phase}
              onChange={(e) =>
                setPhase(e.target.value as 'ENTRY' | 'EXIT' | '')
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              <option value="ENTRY">Entry</option>
              <option value="EXIT">Exit</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Timeframe (Optional)
            </label>

            <Input
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="M15, H1, H4, D1..."
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending
              ? 'Uploading...'
              : 'Upload Screenshot'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}