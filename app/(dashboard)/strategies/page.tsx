import { getStrategies } from '@/lib/actions/strategies'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { StrategyForm } from '@/components/strategies/StrategyForm'
import { DeleteStrategyDialog } from '@/components/strategies/DeleteStrategyDialog'
import { EditStrategyDialog } from '@/components/strategies/EditStrategyDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const revalidate = 0

export default async function StrategiesPage() {
  const strategies = await getStrategies()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategies</h1>
          <p className="text-sm text-muted-foreground">
            Manage your trading strategies.
          </p>
        </div>

        <Dialog>
  <DialogTrigger
    render={
      <Button data-slot="dialog-trigger">
        <Plus className="mr-2 h-4 w-4" />
        New Strategy
      </Button>
    }
  />

  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Create Strategy</DialogTitle>
    </DialogHeader>

    <div className="pt-4">
      <StrategyForm />
    </div>
  </DialogContent>
</Dialog>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="font-semibold text-lg">
              No strategies yet
            </h3>

            <p className="text-muted-foreground mt-2">
              Click "New Strategy" to create your first strategy.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <CardTitle>{strategy.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {strategy.description || 'No description'}
                </p>

                <div className="text-sm">
                  Trades using this strategy:{' '}
                  <strong>{strategy._count.trades}</strong>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created{' '}
                  {new Date(strategy.createdAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end gap-2">
                    <EditStrategyDialog
                        id={strategy.id}
                        name={strategy.name}
                        description={strategy.description}
                    />

                    <DeleteStrategyDialog
                        id={strategy.id}
                        name={strategy.name}
                    />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}