'use client'

import { useState, useTransition } from 'react'
import { createStrategy } from '@/lib/actions/strategies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StrategyFormProps {
  onSuccess?: () => void
}

export function StrategyForm({ onSuccess }: StrategyFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setError(null)

    if (!name.trim()) {
      setError('Strategy name is required.')
      return
    }

    startTransition(async () => {
      const result = await createStrategy({
        name,
        description,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create strategy.')
        return
      }

      setName('')
      setDescription('')

      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          Strategy Name
        </label>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ICT Silver Bullet"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description
        </label>

        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Creating...' : 'Create Strategy'}
      </Button>

    </form>
  )
}