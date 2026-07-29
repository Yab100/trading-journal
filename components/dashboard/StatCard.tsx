import type { ReactNode } from 'react'

type StatCardProps = {
  title: string
  value: string
  icon?: ReactNode
  description?: string
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-xl bg-slate-900 p-6 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-400">{title}</h3>
        {Icon ? <div className="text-slate-400">{Icon}</div> : null}
      </div>

      <p className="mt-2 text-3xl font-bold">{value}</p>
      {description ? <p className="mt-2 text-sm text-slate-400">{description}</p> : null}
    </div>
  )
}