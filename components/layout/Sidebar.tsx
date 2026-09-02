import Link from "next/link";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Trades", href: "/trades" },
  { name: "Analytics", href: "/analytics" },
  { name: "Calendar", href: "/calendar" },
  { name: 'Strategies',  href: '/strategies'},
  { name: "Psychology", href: "/psychology" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
      <h1 className="text-2xl font-bold text-blue-400">
        Trading Journal
      </h1>

      <nav className="mt-10 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}