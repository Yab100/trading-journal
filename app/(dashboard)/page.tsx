import { getDashboardStats, getEquityCurveData } from '@/lib/actions/trades'
import { StatCard } from '@/components/dashboard/StatCard'
import { EquityChart } from '@/components/dashboard/EquityChart'
import { DollarSign, TrendingUp, Target, Activity, Trophy, Crosshair } from 'lucide-react'

export const revalidate = 0

export default async function DashboardPage() {
  const [stats, equityData] = await Promise.all([
    getDashboardStats(),
    getEquityCurveData(),
  ])

  const isProfitable = stats.totalPnl >= 0
  const formattedPnl = `${isProfitable ? '+' : ''}$${stats.totalPnl.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Real-time snapshot of your trading account performance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        <StatCard
          title="Total Net P&L"
          value={formattedPnl}
          description={`${stats.closedTradesCount} closed positions`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />

        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          description={`${stats.winningTrades} wins out of ${stats.closedTradesCount} trades`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />

        <StatCard
          title="Avg Risk:Reward"
          value={`1:${stats.avgRiskReward.toFixed(2)}`}
          description="Average planned setup R:R"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />

        <StatCard
          title="Total Logged Trades"
          value={stats.totalTrades.toString()}
          description={`${stats.openTrades} currently open`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />

        <StatCard
  title="⭐ Best Strategy"
  value={stats.bestStrategy?.name || "N/A"}
  description={
    stats.bestStrategy
      ? `${stats.bestStrategy.trades} trades • ${stats.bestStrategy.wins} wins • $${stats.bestStrategy.pnl.toFixed(2)} P&L`
      : "No strategy data"
  }
  icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
/>

        <StatCard
          title="🎯 Best Entry Type"
          value={stats.bestEntryType?.name || "N/A"}
          description="Most successful entry setup"
          icon={<Crosshair className="h-4 w-4 text-muted-foreground" />}
        />

        

      </div>

      {/* Equity Curve Chart */}
      <EquityChart data={equityData} />
    </div>
  )
}