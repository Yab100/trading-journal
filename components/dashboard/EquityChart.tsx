'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface EquityPoint {
  date: string
  equity: number
  tradePnl: number
  symbol: string
}

interface EquityChartProps {
  data: EquityPoint[]
}

export function EquityChart({ data }: EquityChartProps) {
  const isOverallProfitable = (data[data.length - 1]?.equity ?? 0) >= 0
  const strokeColor = isOverallProfitable ? '#10b981' : '#f43f5e' // emerald-500 or rose-500

  if (!data || data.length <= 1) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Cumulative Equity Curve</CardTitle>
          <CardDescription>Track your total account growth over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Log trades with exit prices and P&L to visualize your equity curve.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Cumulative Equity Curve</CardTitle>
        <CardDescription>Real-time account growth across closed trades</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />

              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as EquityPoint
                    const isWin = point.tradePnl >= 0

                    return (
                      <div className="rounded-lg border bg-popover p-3 shadow-md text-popover-foreground text-xs space-y-1">
                        <p className="font-semibold">{point.date}</p>
                        {point.symbol !== 'ACCOUNT' && (
                          <p className="text-muted-foreground">Symbol: {point.symbol}</p>
                        )}
                        <p className="font-mono text-sm font-bold">
                          Total Equity: ${point.equity.toLocaleString()}
                        </p>
                        {point.symbol !== 'ACCOUNT' && (
                          <p className={`font-mono ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                            Trade PnL: {isWin ? '+' : ''}${point.tradePnl.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />

              <Area
                type="monotone"
                dataKey="equity"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}