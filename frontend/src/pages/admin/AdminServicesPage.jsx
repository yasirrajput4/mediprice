import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, X, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/apiServices';
import { LoadingSpinner, Badge } from '../../components/common/UI';

const HOSPITAL_ID = 1;

export default function AdminServicesPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchQ, setSearchQ] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services', HOSPITAL_ID],
    queryFn: () => adminApi.services(HOSPITAL_ID),
  });

  const updateMutation = useMutation({
    mutationFn: ({ serviceId, data }) => adminApi.updateService(HOSPITAL_ID, serviceId, data),
    onSuccess: () => {
      toast.success('Service updated');
      qc.invalidateQueries(['admin-services', HOSPITAL_ID]);
      setEditingId(null);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Update failed'),
  });

  const startEdit = (svc) => {
    setEditingId(svc.hospital_service_id);
    setEditForm({
      price: svc.price,
      waitTimeMin: svc.wait_time_min,
      isAvailable: svc.is_available,
    });
  };

  const saveEdit = (svc) => {
    updateMutation.mutate({
      serviceId: svc.service_id,
      data: {
        price: parseFloat(editForm.price),
        waitTimeMin: parseInt(editForm.waitTimeMin),
        isAvailable: editForm.isAvailable,
      },
    });
  };

  // Group by category
  const filtered = services.filter((s) => s.name.toLowerCase().includes(searchQ.toLowerCase()));
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Services & Pricing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update prices and wait times for your hospital</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search services…"
            className="input pl-9 w-56 text-sm"
          />
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">{category}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Service</th>
                <th className="text-right px-5 py-3 font-medium">Price (₹)</th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Wait (min)</th>
                <th className="text-center px-5 py-3 font-medium hidden md:table-cell">Available</th>
                <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Last Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((svc) => {
                const isEditing = editingId === svc.hospital_service_id;
                return (
                  <tr key={svc.hospital_service_id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{svc.name}</div>
                      {svc.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{svc.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="input w-28 text-right text-sm py-1.5"
                          min={0}
                          step={10}
                        />
                      ) : (
                        <span className="font-semibold text-gray-900">₹{Number(svc.price).toLocaleString('en-IN')}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.waitTimeMin}
                          onChange={(e) => setEditForm({ ...editForm, waitTimeMin: e.target.value })}
                          className="input w-20 text-right text-sm py-1.5"
                          min={1}
                        />
                      ) : (
                        <span className="text-gray-600">{svc.wait_time_min} min</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editForm.isAvailable}
                          onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                          className="w-4 h-4 accent-blue-600"
                        />
                      ) : (
                        <Badge color={svc.is_available ? 'green' : 'red'}>
                          {svc.is_available ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-gray-400 hidden md:table-cell">
                      {new Date(svc.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(svc)}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(svc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">No services match your search.</div>
      )}
    </div>
  );
}
