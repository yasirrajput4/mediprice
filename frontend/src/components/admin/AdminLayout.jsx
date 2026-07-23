import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  {
    to: "/admin/services",
    icon: <ListChecks size={18} />,
    label: "Services & Prices",
  },
  {
    to: "/admin/bookings",
    icon: <CalendarDays size={18} />,
    label: "Bookings",
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    // ✅ Fix: h-screen → h-dvh (prefer-dvh-over-vh)
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 text-white flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <div className="font-bold text-sm">MediPrice</div>
              <div className="text-xs text-gray-400">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="px-3 mb-2">
            <div className="text-sm font-medium text-white truncate">
              {user?.name}
            </div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          {/* ✅ Fix: control-has-associated-label — aria-label added */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout from admin panel"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ✅ Fix: static div with onClick → button (no-static-element-interactions + click-events-have-key-events) */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden w-full h-full cursor-default border-0"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-gray-700">
            Hospital Admin
          </h1>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
