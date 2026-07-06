import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Clock,
  Shield,
  TrendingUp,
  ArrowRight,
  Star,
} from "lucide-react";
import { servicesApi } from "../services/apiServices";
import { LoadingSpinner } from "../components/common/UI";

const POPULAR_SEARCHES = [
  "X-Ray",
  "MRI",
  "Blood Test",
  "ECG",
  "Ultrasound",
  "CT Scan",
];

export default function HomePage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Ahmedabad");
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: servicesApi.categories,
  });

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["trending", city],
    queryFn: () => servicesApi.trending(city),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    navigate(`/search?${params}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-5 font-medium">
            <Shield size={14} /> Trusted by 50,000+ patients across India
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Compare Hospital Prices.
            <br />
            <span className="text-teal-200">Book Instantly.</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Transparent pricing for X-rays, MRIs, blood tests and more — from
            verified hospitals near you.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl"
          >
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search service — MRI, CBC, X-Ray…"
                className="flex-1 py-2.5 text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2 px-3 border-t md:border-t-0 md:border-l border-gray-100">
              <MapPin size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-32 py-2.5 text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="btn-primary whitespace-nowrap py-3 px-6"
            >
              Search
            </button>
          </form>

          {/* Popular */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR_SEARCHES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => navigate(`/search?q=${s}&city=${city}`)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm backdrop-blur-sm transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Hospitals Listed", value: "200+" },
            { label: "Services Covered", value: "500+" },
            { label: "Cities", value: "25+" },
            { label: "Avg. Savings", value: "35%" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-blue-700">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Browse by Category
          </h2>
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => navigate(`/search?category=${cat.slug}`)}
              className="card flex flex-col items-center gap-2 py-5 hover:border-blue-200 hover:shadow-md transition-all group text-center"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400">
                {cat.service_count} services
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Trending in {city}
            </h2>
          </div>
          {trendingLoading ? (
            <LoadingSpinner text="Loading trending services..." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((svc) => (
                <button
                  type="button"
                  key={svc.id}
                  onClick={() => navigate(`/search?q=${svc.name}&city=${city}`)}
                  className="card flex items-start gap-3 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">
                    {svc.category_icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm truncate">
                      {svc.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {svc.hospital_count} hospitals
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-bold text-blue-700">
                        from ₹{Number(svc.lowest_price).toLocaleString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {svc.avg_wait_min} min wait
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1 flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-10">
          How MediPrice Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              icon: <Search size={24} />,
              title: "Search a Service",
              desc: "Type any test or service — MRI, blood test, X-ray. We compare prices across nearby hospitals instantly.",
            },
            {
              step: "2",
              icon: <Star size={24} />,
              title: "Compare & Choose",
              desc: "See prices, wait times, ratings, and distance. Filter by budget or rating to find the best fit.",
            },
            {
              step: "3",
              icon: <Shield size={24} />,
              title: "Book & Pay Securely",
              desc: "Pick a slot, enter patient details, and pay online via Razorpay. Get instant confirmation.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                {s.icon}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-500">
                Step {s.step}
              </div>
              <h3 className="font-semibold text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
