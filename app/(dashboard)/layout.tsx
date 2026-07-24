import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <div className="flex-1 p-10">{children}</div>
    </main>
  );
}