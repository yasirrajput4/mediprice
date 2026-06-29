import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Globe, Clock, Star, Shield, ChevronRight, Search } from 'lucide-react';
import { hospitalsApi } from '../services/apiServices';
import { LoadingSpinner, StarRating, Badge, PriceTag } from '../components/common/UI';

export default function HospitalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalsApi.get(id),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['hospital-services', id, activeCategory],
    queryFn: () => hospitalsApi.services(id, { category: activeCategory || undefined }),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['hospital-reviews', id],
    queryFn: () => hospitalsApi.reviews(id),
    enabled: activeTab === 'reviews',
  });

  if (isLoading) return <LoadingSpinner text="Loading hospital profile..." />;
  if (!hospital) return <div className="text-center py-20 text-gray-500">Hospital not found.</div>;

  const categories = [...new Set(services.map((s) => s.category))];
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) &&
    (!activeCategory || s.category === activeCategory)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600 flex-shrink-0">
            {hospital.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
                  {hospital.is_verified && <Badge color="green">✓ NABH Verified</Badge>}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin size={14} /> {hospital.address}, {hospital.city}
                </div>
              </div>
              <div className="text-right">
                <StarRating rating={hospital.rating} size={16} />
                <div className="text-xs text-gray-400 mt-0.5">{hospital.review_count} reviews</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><Clock size={14} /> Avg wait: ~{hospital.avg_wait_min} min</span>
              {hospital.phone && <a href={`tel:${hospital.phone}`} className="flex items-center gap-1.5 hover:text-blue-600"><Phone size={14} />{hospital.phone}</a>}
              {hospital.website && <a href={hospital.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-blue-600"><Globe size={14} />Website</a>}
            </div>

            {hospital.accreditations?.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {hospital.accreditations.map((a) => (
                  <Badge key={a} color="purple">{a}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {hospital.description && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{hospital.description}</p>
        )}

        {hospital.facilities?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {hospital.facilities.map((f) => (
              <span key={f} className="badge bg-gray-100 text-gray-600">{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-0">
        {['services', 'reviews', 'about'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Services tab */}
      {activeTab === 'services' && (
        <div>
          {/* Service search + category filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search service..."
                className="input pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  !activeCategory ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                    activeCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services list */}
          <div className="space-y-3">
            {filteredServices.map((svc) => (
              <div key={svc.hospital_service_id} className="card flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">
                  {svc.category_icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{svc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span className="badge bg-gray-100 text-gray-500">{svc.category}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{svc.wait_time_min} min</span>
                    {svc.report_time && <span>Report: {svc.report_time}</span>}
                  </div>
                  {svc.preparation && (
                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <Shield size={11} /> {svc.preparation}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <PriceTag price={svc.price} discountedPrice={svc.discounted_price} size="md" />
                  <button
                    onClick={() => navigate(`/book/${hospital.id}/${svc.service_id}`)}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1"
                  >
                    Book <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <p className="text-center text-gray-400 py-12 text-sm">No services match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="card flex items-center gap-6 bg-blue-50 border-blue-100">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-700">{Number(hospital.rating).toFixed(1)}</div>
              <StarRating rating={hospital.rating} size={16} showValue={false} />
              <div className="text-xs text-gray-500 mt-1">{hospital.review_count} reviews</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map((r) => (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-gray-500">{r}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${r === Math.round(hospital.rating) ? 60 : r < Math.round(hospital.rating) ? 20 : 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm text-gray-900">{r.user_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.service_name}</div>
                </div>
                <StarRating rating={r.rating} size={13} showValue={false} />
              </div>
              {r.review_text && <p className="text-sm text-gray-600 leading-relaxed">{r.review_text}</p>}
              <div className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-center text-gray-400 py-12 text-sm">No reviews yet.</p>}
        </div>
      )}

      {/* About tab */}
      {activeTab === 'about' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">About {hospital.name}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{hospital.description || 'No description available.'}</p>
          {hospital.facilities?.length > 0 && (
            <>
              <h4 className="font-semibold text-gray-800 mt-5 mb-2 text-sm">Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {hospital.facilities.map((f) => <Badge key={f} color="gray">{f}</Badge>)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
