import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">
        <StatCard title="Balance" value="$10,250" />
        <StatCard title="Win Rate" value="68%" />
        <StatCard title="Profit Factor" value="2.15" />
        <StatCard title="Trades" value="245" />
      </div>

      <div className="mt-10 h-96 rounded-xl bg-slate-900 p-6">
        <h2 className="text-xl font-semibold">
          Equity Curve
        </h2>

        <div className="flex h-full items-center justify-center text-slate-500">
          Chart coming soon...
        </div>
      </div>
    </>
  );
}