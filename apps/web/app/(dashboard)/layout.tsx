import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-60 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Fintech</h2>

        <ul className="space-y-3">
          <li>
            <Link href="/dashboard" className="hover:text-blue-400">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/trading" className="hover:text-blue-400">
              Trading
            </Link>
          </li>
          <li>Portfolio</li>
          <li>Alerts</li>
          <li>Settings</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-6">
        {/* Topbar */}
        <div className="mb-4 font-semibold">Topbar</div>

        {children}
      </div>
    </div>
  );
}