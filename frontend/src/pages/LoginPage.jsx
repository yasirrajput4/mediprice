import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { Eye, EyeOff } from "lucide-react";

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return toast.error("All fields required");
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to your MediPrice account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* ✅ Fix: label-has-associated-control + no-placeholder-only-field */}
          <div>
            <label
              htmlFor="login-email"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              className="input"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input pr-10"
                autoComplete="current-password"
              />
              {/* ✅ Fix: aria-label (control-has-associated-label) */}
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.password || (!form.email && !form.phone)) {
      return toast.error("Name, password and email or phone required");
    }
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Join MediPrice to book and track appointments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* ✅ Fix: all labels have htmlFor + inputs have matching id */}
          <div>
            <label
              htmlFor="reg-name"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              className="input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Mobile <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                +91
              </span>
              <input
                id="reg-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit number"
                className="input pl-12"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="text-xs font-medium text-gray-600 block mb-1.5"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
