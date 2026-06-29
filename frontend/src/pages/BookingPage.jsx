import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, Phone, CreditCard, ChevronLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { hospitalsApi, bookingsApi } from '../services/apiServices';
import { initiateRazorpayPayment } from '../services/razorpay';
import { LoadingSpinner, PriceTag } from '../components/common/UI';
import { useAuthStore } from '../store/authStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function BookingPage() {
  const { hospitalId, serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState(1); // 1=slot, 2=details, 3=payment

  const [form, setForm] = useState({
    patientName: user?.name || '',
    patientPhone: user?.phone || '',
    patientRelation: 'self',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Today's date string
  const today = new Date().toISOString().split('T')[0];

  const { data: hospital, isLoading: hospitalLoading } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => hospitalsApi.get(hospitalId),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['hospital-services-all', hospitalId],
    queryFn: () => hospitalsApi.services(hospitalId),
  });

  const service = services.find((s) => s.service_id == serviceId);

  const { data: slots = {} } = useQuery({
    queryKey: ['slots', hospitalId, serviceId, today],
    queryFn: () => hospitalsApi.slots(hospitalId, { service_id: serviceId, date: today }),
    enabled: !!(hospitalId && serviceId),
  });

  const availableDates = Object.keys(slots).sort();
  const slotsForDate = selectedDate ? slots[selectedDate] || [] : [];

  const handleBookAndPay = async () => {
    if (!form.patientName || !form.patientPhone) {
      toast.error('Please fill in patient details');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.patientPhone)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // 1. Create booking
      const booking = await bookingsApi.create({
        hospitalId: parseInt(hospitalId),
        serviceId: parseInt(serviceId),
        timeSlotId: selectedSlot?.id,
        slotDate: selectedDate,
        slotTime: selectedSlot?.time,
        ...form,
      });
      setCreatedBooking(booking);

      // 2. Initiate Razorpay
      await initiateRazorpayPayment({
        bookingId: booking.id,
        bookingUuid: booking.uuid,
        userName: form.patientName,
        userPhone: form.patientPhone,
        onSuccess: (result) => {
          toast.success('Payment successful! Booking confirmed.');
          navigate(`/booking/${booking.uuid}/confirm`);
        },
        onFailure: (err) => {
          toast.error('Payment failed. You can retry from My Bookings.');
          navigate(`/booking/${booking.uuid}/confirm`);
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (hospitalLoading) return <LoadingSpinner />;

  const totalAmount = (service?.price || 0) + 49; // ₹49 platform fee

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {['Select Slot', 'Patient Details', 'Payment'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-blue-700' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          {/* Step 1 — Slot */}
          {step === 1 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
                <Calendar size={18} className="text-blue-600" /> Select Date & Time
              </h2>

              {/* Dates */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                      selectedDate === date
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
                {availableDates.length === 0 && (
                  <p className="text-sm text-gray-400 py-3">No available slots in the next 7 days.</p>
                )}
              </div>

              {/* Times */}
              {selectedDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Available Times</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slotsForDate.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                          selectedSlot?.id === slot.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {slot.time.substring(0, 5)}
                        <div className="text-xs opacity-70">{slot.available} left</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="btn-primary w-full mt-6 py-3 disabled:opacity-40"
              >
                Continue to Patient Details
              </button>
            </div>
          )}

          {/* Step 2 — Patient details */}
          {step === 2 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
                <User size={18} className="text-blue-600" /> Patient Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Patient Name *</label>
                  <input
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder="Full name of patient"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">+91</span>
                    <input
                      value={form.patientPhone}
                      onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="input pl-12"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Booking For</label>
                  <div className="flex gap-2">
                    {['self', 'spouse', 'parent', 'child', 'other'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setForm({ ...form, patientRelation: r })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition ${
                          form.patientRelation === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any relevant medical history or special requests..."
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Review & Pay</button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
                <CreditCard size={18} className="text-blue-600" /> Review & Pay
              </h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-700">
                  <span>Patient</span><span className="font-medium">{form.patientName}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Mobile</span><span>+91 {form.patientPhone}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Date</span><span>{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Time</span><span>{selectedSlot?.time?.substring(0, 5)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Service fee</span><span>₹{Number(service?.price || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform fee</span><span>₹49</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-2">
                  <span>Total</span><span>₹{Number(totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-xs text-emerald-700 mt-4">
                <Shield size={14} /> Secured by Razorpay · 256-bit SSL encryption
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">Back</button>
                <button
                  onClick={handleBookAndPay}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>Processing…</>
                  ) : (
                    <>Pay ₹{Number(totalAmount).toLocaleString('en-IN')}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div>
          <div className="card sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Booking Summary</h3>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl mx-auto mb-2">
                {service?.category_icon || '🏥'}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{service?.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{hospital?.name}</div>
            </div>
            {service?.price && (
              <div className="text-center">
                <PriceTag price={service.price} discountedPrice={service.discounted_price} size="lg" />
              </div>
            )}
            {selectedDate && selectedSlot && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2"><Calendar size={13} />{formatDate(selectedDate)}</div>
                <div className="flex items-center gap-2"><Clock size={13} />{selectedSlot.time?.substring(0, 5)}</div>
                <div className="flex items-center gap-2"><Clock size={13} />~{service?.wait_time_min} min wait</div>
              </div>
            )}
            {service?.preparation && (
              <div className="mt-4 pt-4 border-t border-gray-100 bg-amber-50 rounded-xl px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                <Shield size={13} className="mt-0.5 flex-shrink-0" />
                <div><strong>Preparation:</strong> {service.preparation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
