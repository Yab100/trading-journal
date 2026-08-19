'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  strategies: {
    id: string
    name: string
  }[]
}

export function TradeFilters({ strategies }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`/trades?${params.toString()}`)
  }

  function resetFilters() {
    router.push('/trades')
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card/80 p-4 backdrop-blur md:grid-cols-2 lg:grid-cols-7">

      {/* Search */}

      <Input
        placeholder="Search symbol..."
        value={searchParams.get('search') ?? ''}
        onChange={(e) => updateFilter('search', e.target.value)}
      />

      {/* Status */}

      <Select
        value={searchParams.get('status') ?? 'all'}
        onValueChange={(value) =>
          updateFilter('status', value === 'all' || value === null ? '' : value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
        </SelectContent>
      </Select>

      {/* Direction */}

      <Select
        value={searchParams.get('direction') ?? 'all'}
        onValueChange={(value) =>
          updateFilter('direction', value === 'all' || value === null ? '' : value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Directions</SelectItem>
          <SelectItem value="LONG">Buy</SelectItem>
          <SelectItem value="SHORT">Sell</SelectItem>
        </SelectContent>
      </Select>

      {/* Strategy */}

      <Select
        value={searchParams.get('strategyId') ?? 'all'}
        onValueChange={(value) =>
          updateFilter('strategyId', value === 'all' || value === null ? '' : value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Strategy" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Strategies</SelectItem>

          {strategies.map((strategy) => (
            <SelectItem
              key={strategy.id}
              value={strategy.id}
            >
              {strategy.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Entry Type */}

      <Select
        value={searchParams.get('entryType') ?? 'all'}
        onValueChange={(value) =>
          updateFilter('entryType', value === 'all' || value === null ? '' : value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Entry Type" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All Entry Types
          </SelectItem>

          <SelectItem value="FLIP">
            Flip
          </SelectItem>

          <SelectItem value="BREAK_CURRENT_HL">
            Break Current H/L
          </SelectItem>

          <SelectItem value="BREAK_PREVIOUS_HL">
            Break Previous H/L
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Timeframe */}

      <Select
        value={searchParams.get('timeframe') ?? 'all'}
        onValueChange={(value) =>
          updateFilter('timeframe', value === 'all' || value === null ? '' : value)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Timeframe" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Timeframes</SelectItem>

          <SelectItem value="M1">M1</SelectItem>
          <SelectItem value="M5">M5</SelectItem>
          <SelectItem value="M15">M15</SelectItem>
          <SelectItem value="M30">M30</SelectItem>
          <SelectItem value="H1">H1</SelectItem>
          <SelectItem value="H4">H4</SelectItem>
          <SelectItem value="D1">D1</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}

      <Button
        className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white"
        onClick={resetFilters}
      >
        Reset
      </Button>

    </div>
  )
}