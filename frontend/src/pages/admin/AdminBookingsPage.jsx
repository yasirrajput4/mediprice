import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../services/apiServices";
import {
  LoadingSpinner,
  EmptyState,
  Badge,
  Pagination,
} from "../../components/common/UI";

const HOSPITAL_ID = 1;

const STATUS_COLORS = {
  confirmed: "green",
  pending: "amber",
  completed: "blue",
  cancelled: "red",
  no_show: "gray",
};

const STATUS_OPTIONS = [
  "confirmed",
  "pending",
  "completed",
  "cancelled",
  "no_show",
];

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bookings", HOSPITAL_ID, date, statusFilter, page],
    queryFn: () =>
      adminApi.bookings(HOSPITAL_ID, {
        date: date || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      }),
    keepPreviousData: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) =>
      adminApi.updateBookingStatus(HOSPITAL_ID, bookingId, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries(["admin-bookings", HOSPITAL_ID]);
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to update"),
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage and track all patient bookings
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <label htmlFor="filter-date" className="sr-only">
            Filter by date
          </label>
          <Calendar
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="input pl-9 w-44 text-sm"
          />
        </div>

        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input w-40 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.replace("_", " ")}
            </option>
          ))}
        </select>

        {(date || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setDate("");
              setStatusFilter("");
              setPage(1);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-gray-400">
          {pagination.total || 0} bookings
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium">Patient</th>
                <th className="text-left px-5 py-3 font-medium">Service</th>
                <th className="text-left px-5 py-3 font-medium">Date & Time</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-center px-5 py-3 font-medium">Payment</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.uuid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">
                      {b.patient_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {b.patient_phone}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-gray-700 max-w-[180px] truncate">
                      {b.service_name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-gray-700">
                      {new Date(b.slot_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {String(b.slot_time).substring(0, 5)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                    ₹{Number(b.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge
                      color={b.payment_status === "paid" ? "green" : "amber"}
                    >
                      {b.payment_status || "pending"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge color={STATUS_COLORS[b.status] || "gray"}>
                      {b.status?.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusDropdown
                      current={b.status}
                      onSelect={(status) =>
                        updateStatusMutation.mutate({
                          bookingId: b.uuid,
                          status,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page || 1}
        pages={pagination.pages || 1}
        onChange={setPage}
      />
    </div>
  );
}

function StatusDropdown({ current, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const next = STATUS_OPTIONS.filter((s) => s !== current);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Update booking status"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
      >
        Update <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close status dropdown"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            className="fixed inset-0 z-10 w-full h-full cursor-default bg-transparent border-0"
          />
          {/* ✅ Fix: Removed role="listbox" and aria-label from the <ul> element to prevent nested interactive/focusable role conflicts */}
          <ul className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {next.map((s) => (
              <li key={s} role="presentation">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 capitalize transition-colors"
                >
                  {s.replace("_", " ")}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
