import { prisma } from '@/lib/prisma'
import { TradeForm } from '@/components/trades/TradeForm'

type StrategyOption = {
  id: string
  name: string
}

export const dynamic = 'force-dynamic'

export default async function NewTradePage() {
  const strategies = await prisma.strategy.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <TradeForm
      strategies={strategies.map(
        (strategy: StrategyOption) => ({
          id: strategy.id,
          name: strategy.name,
        })
      )}
    />
  )
}