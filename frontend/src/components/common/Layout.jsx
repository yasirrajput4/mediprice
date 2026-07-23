import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return;
  // ✅ Fix: min-h-screen → min-h-dvh (prefer-dvh-over-vh)
  <div className="min-h-dvh flex flex-col">
    {/* Navbar */}
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">MediPrice</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/search"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/search")
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Search size={15} /> Find Services
            </span>
          </Link>
          {user && (
            <Link
              to="/my-bookings"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/my-bookings")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} /> My Bookings
              </span>
            </Link>
          )}
          {user?.role !== "patient" && (
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard size={15} /> Admin
              </span>
            </Link>
          )}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        {/* ✅ Fix: aria-label added (control-has-associated-label) */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link
            to="/search"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Find Services
          </Link>
          {user && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              My Bookings
            </Link>
          )}
          {user?.role !== "patient" && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50"
            >
              Admin Panel
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center btn-secondary text-sm py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center btn-primary text-sm py-2"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Page content */}
    <main className="flex-1">
      <Outlet />
    </main>

    {/* Footer */}
    <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-white font-bold">MediPrice</span>
            </div>
            <p className="text-xs leading-relaxed">
              Transparent healthcare pricing across India's top hospitals and
              clinics.
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/search?category=imaging"
                  className="hover:text-white transition-colors"
                >
                  Imaging & Radiology
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=diagnostics"
                  className="hover:text-white transition-colors"
                >
                  Lab Tests
                </Link>
              </li>
              <li>
                <Link
                  to="/search?category=cardiology"
                  className="hover:text-white transition-colors"
                >
                  Cardiology
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-xs text-center">
          © {new Date().getFullYear()} MediPrice. All rights reserved. Prices
          are indicative — verify with the hospital.
        </div>
      </div>
    </footer>
  </div>;
}
