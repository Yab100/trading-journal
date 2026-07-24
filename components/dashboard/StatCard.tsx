type StatCardProps = {
  title: string;
  value: string;
};

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-slate-900 p-6 shadow">
      <h3 className="text-slate-400">{title}</h3>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}