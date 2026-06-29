import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import HospitalPage from "./pages/HospitalPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmPage from "./pages/BookingConfirmPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children, role }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hospitals/:id" element={<HospitalPage />} />
        <Route path="/book/:hospitalId/:serviceId" element={<BookingPage />} />
        <Route
          path="/booking/:bookingId/confirm"
          element={<BookingConfirmPage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="hospital_admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
