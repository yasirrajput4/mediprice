import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsApi } from '../services/apiServices';
import { LoadingSpinner, EmptyState, Badge } from '../components/common/UI';

const STATUS_COLORS = {
  confirmed: 'green',
  pending: 'amber',
  cancelled: 'red',
  completed: 'blue',
  no_show: 'gray',
};

export default function MyBookingsPage() {
  const [status, setStatus] = useState('');
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings', status],
    queryFn: () => bookingsApi.list({ status: status || undefined }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled');
      qc.invalidateQueries(['my-bookings']);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to cancel'),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['', 'confirmed', 'pending', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
              status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="You haven't made any bookings yet."
          action={<Link to="/search" className="btn-primary text-sm">Find a Service</Link>}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.uuid} className="card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-gray-900">{b.service_name}</div>
                  <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={13} /> {b.hospital_name}
                  </div>
                </div>
                <Badge color={STATUS_COLORS[b.status] || 'gray'}>{b.status}</Badge>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Calendar size={14} />
                  {new Date(b.slot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1"><Clock size={14} />{b.slot_time?.substring(0,5)}</span>
                <span className="font-semibold text-gray-900">₹{Number(b.total_amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <Link to={`/booking/${b.uuid}/confirm`} className="btn-secondary text-sm py-1.5 px-3">View Details</Link>
                {['pending', 'confirmed'].includes(b.status) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Cancel this booking?')) cancelMutation.mutate(b.uuid);
                    }}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                  >
                    <XCircle size={15} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
