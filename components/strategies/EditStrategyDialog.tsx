'use client'

import { useState, useTransition } from 'react'
import { updateStrategy } from '@/lib/actions/strategies'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  id: string
  name: string
  description?: string | null
}

export function EditStrategyDialog({
  id,
  name,
  description,
}: Props) {
  const [strategyName, setStrategyName] = useState(name)
  const [strategyDescription, setStrategyDescription] = useState(
    description ?? ''
  )

  const [isPending, startTransition] = useTransition()

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Strategy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <div>
            <label className="text-sm font-medium">
              Strategy Name
            </label>

            <Input
              value={strategyName}
              onChange={(e) =>
                setStrategyName(e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>

            <Input
              value={strategyDescription}
              onChange={(e) =>
                setStrategyDescription(e.target.value)
              }
            />
          </div>

        </div>

        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await updateStrategy(id, {
                  name: strategyName,
                  description: strategyDescription,
                })
              })
            }
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}