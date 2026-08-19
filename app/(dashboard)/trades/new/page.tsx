import { prisma } from '@/lib/prisma'
import { TradeForm } from '@/components/trades/TradeForm'

export default async function NewTradePage() {
  const strategies = await prisma.strategy.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <TradeForm
      strategies={strategies.map((strategy) => ({
        id: strategy.id,
        name: strategy.name,
      }))}
    />
  )
}