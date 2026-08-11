'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { deleteScreenshot } from '@/lib/actions/screenshots'

import { Trash2 } from 'lucide-react'

interface Props {
  screenshot: {
    id: string
    phase: string | null
    timeframe: string | null
    signedUrl: string | null
  }
}

export function ScreenshotCard({ screenshot }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deleted, setDeleted] = useState(false)

  if (deleted) return null

  function handleDelete() {
    if (!confirm('Delete this screenshot?')) return

    startTransition(async () => {
      const result = await deleteScreenshot(screenshot.id)

      if (result.success) {
        setDeleted(true)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Dialog>
        <DialogTrigger>
          <div className="block w-full cursor-pointer">
            {screenshot.signedUrl && (
              <Image
                src={screenshot.signedUrl}
                alt="Screenshot"
                width={1200}
                height={900}
                className="h-56 w-full cursor-pointer object-cover transition hover:scale-105"
              />
            )}
          </div>
        </DialogTrigger>

        <DialogContent className="h-screen w-screen max-w-none border-0 bg-black p-0">
          {screenshot.signedUrl && (
            <Image
              src={screenshot.signedUrl}
              alt="Screenshot"
              fill
              className="object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-2 p-3">
        <div className="flex justify-between">
          <span>Phase</span>
          <span>{screenshot.phase ?? '-'}</span>
        </div>

        <div className="flex justify-between">
          <span>Timeframe</span>
          <span>{screenshot.timeframe ?? '-'}</span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />

          {isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  )
}