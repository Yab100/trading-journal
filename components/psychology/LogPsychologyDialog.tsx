'use client'

import { useState, useTransition } from 'react'
import { updateTradePsychology } from '@/lib/actions/psychology'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Brain, Star } from 'lucide-react'

const EMOTION_OPTIONS = [
  'Disciplined',
  'Patient',
  'FOMO',
  'Revenge Trade',
  'Hesitant',
  'Overconfident',
  'Anxious',
  'Greedy',
]

interface LogPsychologyDialogProps {
  trade: {
    id: string
    symbol: string
    discipline_rating?: number | null
    execution_rating?: number | null
    emotions?: string[] | null
    notes?: string | null
  }
}

export function LogPsychologyDialog({ trade }: LogPsychologyDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [discipline, setDiscipline] = useState<number>(trade.discipline_rating || 3)
  const [execution, setExecution] = useState<number>(trade.execution_rating || 3)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(trade.emotions || [])
  const [notes, setNotes] = useState<string>(trade.notes || '')
  const [error, setError] = useState<string | null>(null)

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    )
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateTradePsychology(trade.id, {
        discipline_rating: discipline,
        execution_rating: execution,
        emotions: selectedEmotions,
        notes,
      })

      if (!res.success) {
        setError(res.error || 'Failed to update psychology data.')
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <Button
  size="sm"
  onClick={() => setOpen(true)}
>
  LOG PSYCHOLOGY
</Button>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Psychology Log — {trade.symbol}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Discipline Score (1-5 Stars) */}
          <div>
            <Label className="text-sm font-medium">Discipline Rating (Plan Adherence)</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDiscipline(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= discipline
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Execution Rating (1-5 Stars) */}
          <div>
            <Label className="text-sm font-medium">Execution Quality (Entry & Exit Timing)</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setExecution(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= execution
                        ? 'fill-blue-400 text-blue-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Emotional State Tags */}
          <div>
            <Label className="text-sm font-medium">Emotional Triggers & State</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EMOTION_OPTIONS.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion)
                return (
                  <Badge
                    key={emotion}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleEmotion(emotion)}
                  >
                    {emotion}
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Reflective Notes</Label>
            <Textarea
              id="notes"
              placeholder="What were you feeling before taking this entry? Did you cut losses early?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="p-2 text-xs text-rose-500 bg-rose-500/10 rounded border border-rose-500/20">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}