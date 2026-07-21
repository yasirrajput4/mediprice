// BookingConfirmPage.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Download,
  Home,
} from "lucide-react";
import { bookingsApi } from "../services/apiServices";
import { LoadingSpinner } from "../components/common/UI";

export function BookingConfirmPage() {
  const { bookingId } = useParams();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
  });

  if (isLoading) return <LoadingSpinner text="Loading booking..." />;
  if (!booking)
    return (
      <div className="text-center py-20 text-gray-500">Booking not found.</div>
    );

  const isPaid = booking.payment_status === "paid";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div
        className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-5 ${isPaid ? "bg-emerald-100" : "bg-amber-100"}`}
      >
        <CheckCircle
          size={40}
          className={isPaid ? "text-emerald-500" : "text-amber-500"}
        />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isPaid ? "Booking Confirmed!" : "Booking Received!"}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {isPaid
          ? "Your payment was successful. Show this confirmation at the hospital."
          : "Your booking is pending payment. You can pay at the hospital."}
      </p>

      <div className="card text-left space-y-3 mb-8">
        <div className="flex items-center gap-3 text-sm">
          <MapPin size={16} className="text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">
              {booking.hospital_name}
            </div>
            <div className="text-gray-500 text-xs">
              {booking.hospital_address}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar size={16} className="text-blue-500" />
          <span className="text-gray-700">
            {new Date(booking.slot_date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock size={16} className="text-blue-500" />
          <span className="text-gray-700">
            {booking.slot_time?.substring(0, 5)}
          </span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Total Paid</span>
          <span className="font-bold text-gray-900">
            ₹{Number(booking.total_amount).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Booking ID</span>
          <span className="font-mono">
            {booking.uuid?.substring(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {booking.service_preparation && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 text-left mb-6">
          <strong>Important:</strong> {booking.service_preparation}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to="/"
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <Home size={16} /> Home
        </Link>
        <Link to="/my-bookings" className="btn-primary flex-1">
          My Bookings
        </Link>
      </div>
    </div>
  );
}

export default BookingConfirmPage;
