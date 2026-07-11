import {
  Star,
  Loader2,
  SearchX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Constants (Moved outside components for performance) ─────────────────────
const BADGE_COLORS = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
  gray: "bg-gray-100 text-gray-600",
};

const SIZE_MAP = { sm: "text-base", md: "text-xl", lg: "text-2xl" };

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({
  rating = 0,
  max = 5,
  size = 14,
  showValue = true,
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      {showValue && (
        <span className="text-sm font-medium text-gray-700 ml-0.5">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </span>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: Math.min(pages, 7) }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "blue" }) {
  return (
    <span className={`badge ${BADGE_COLORS[color] || BADGE_COLORS.blue}`}>
      {children}
    </span>
  );
}

// ── PriceTag ──────────────────────────────────────────────────────────────────
export function PriceTag({ price, discountedPrice, size = "md" }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={`font-bold text-gray-900 ${SIZE_MAP[size]}`}>
        ₹{Number(discountedPrice || price).toLocaleString("en-IN")}
      </span>
      {discountedPrice && (
        <span className="text-sm text-gray-400 line-through">
          ₹{Number(price).toLocaleString("en-IN")}
        </span>
      )}
    </span>
  );
}
