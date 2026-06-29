import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, MapPin, Star, Clock, ChevronDown, X, ArrowUpDown } from 'lucide-react';
import { hospitalsApi, servicesApi } from '../services/apiServices';
import { LoadingSpinner, EmptyState, Pagination, StarRating, Badge } from '../components/common/UI';

const SORT_OPTIONS = [
  { value: 'price', label: 'Lowest Price' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'wait', label: 'Least Wait' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || 'Ahmedabad');
  const [sort, setSort] = useState('price');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxWait, setMaxWait] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [serviceId, setServiceId] = useState(null);

  const category = searchParams.get('category') || '';

  // First: search for the service to get a service_id for price filtering
  const { data: serviceSearch } = useQuery({
    queryKey: ['service-search', q],
    queryFn: () => servicesApi.search({ q, limit: 1 }),
    enabled: !!q,
  });

  useEffect(() => {
    if (serviceSearch?.services?.length) {
      setServiceId(serviceSearch.services[0].id);
    } else {
      setServiceId(null);
    }
  }, [serviceSearch]);

  const params = {
    city: city || undefined,
    sort,
    page,
    limit: 10,
    ...(minRating && { minRating }),
    ...(maxPrice && { maxPrice }),
    ...(maxWait && { maxWait }),
    ...(serviceId && { service_id: serviceId }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['hospitals', params],
    queryFn: () => hospitalsApi.list(params),
    keepPreviousData: true,
  });

  const hospitals = data?.hospitals || [];
  const pagination = data?.pagination || {};

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    const p = {};
    if (q) p.q = q;
    if (city) p.city = city;
    if (category) p.category = category;
    setSearchParams(p);
  };

  const clearFilters = () => {
    setMinRating('');
    setMaxPrice('');
    setMaxWait('');
    setPage(1);
  };

  const hasFilters = minRating || maxPrice || maxWait;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search service…"
            className="input pl-9"
          />
        </div>
        <div className="relative w-40">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-5">Search</button>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters — sidebar on desktop, drawer on mobile */}
        <aside className={`lg:w-56 flex-shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="card sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Min rating */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">Min Rating</label>
              <div className="flex gap-1">
                {[3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating == r ? '' : r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                      minRating == r ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {r}+
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">Max Price (₹)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 3000"
                className="input text-sm"
              />
            </div>

            {/* Max wait */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">Max Wait (min)</label>
              <div className="flex gap-1">
                {[15, 30, 60].map((w) => (
                  <button
                    key={w}
                    onClick={() => setMaxWait(maxWait == w ? '' : w)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                      maxWait == w ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {w}m
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { setPage(1); setFilterOpen(false); }} className="btn-primary w-full text-sm py-2">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="lg:hidden btn-secondary text-sm py-2 flex items-center gap-1.5"
              >
                <SlidersHorizontal size={15} /> Filters
                {hasFilters && <Badge color="blue">{[minRating, maxPrice, maxWait].filter(Boolean).length}</Badge>}
              </button>
              {!isLoading && (
                <span className="text-sm text-gray-500">
                  {pagination.total || 0} hospitals{q ? ` for "${q}"` : ''}
                  {city ? ` in ${city}` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards */}
          {isLoading ? (
            <LoadingSpinner text="Searching hospitals..." />
          ) : hospitals.length === 0 ? (
            <EmptyState
              title="No hospitals found"
              description="Try a different service, location, or relax your filters."
              action={<button onClick={clearFilters} className="btn-secondary text-sm">Clear Filters</button>}
            />
          ) : (
            <div className="space-y-4">
              {hospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  serviceId={serviceId}
                  serviceName={q}
                />
              ))}
            </div>
          )}

          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

function HospitalCard({ hospital, serviceId, serviceName }) {
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-all flex flex-col sm:flex-row gap-4">
      {/* Logo */}
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-blue-600">
        {hospital.name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
              {hospital.is_verified && <Badge color="green">✓ Verified</Badge>}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <MapPin size={13} />
              <span className="truncate">{hospital.address}</span>
              {hospital.distance_km && <span className="text-blue-600 font-medium flex-shrink-0">· {hospital.distance_km} km</span>}
            </div>
          </div>
          {hospital.service_price && (
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-blue-700">₹{Number(hospital.service_price).toLocaleString('en-IN')}</div>
              {serviceName && <div className="text-xs text-gray-400">{serviceName}</div>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <StarRating rating={hospital.rating} size={13} />
          <span className="text-xs text-gray-400">({hospital.review_count} reviews)</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} /> ~{hospital.avg_wait_min} min wait
          </span>
          <span className="text-xs text-gray-400">Fairness: {hospital.fairness_score}/100</span>
        </div>

        {hospital.accreditations?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {hospital.accreditations.map((a) => (
              <span key={a} className="badge bg-emerald-50 text-emerald-700 text-xs">{a}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Link to={`/hospitals/${hospital.id}`} className="btn-secondary text-sm py-2 px-4">
            View Profile
          </Link>
          {serviceId && (
            <button
              onClick={() => navigate(`/book/${hospital.id}/${serviceId}`)}
              className="btn-primary text-sm py-2 px-4"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
