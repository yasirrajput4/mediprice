import api from "./api";

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  search: (params) =>
    api.get("/services/search", { params }).then((r) => r.data),
  categories: () => api.get("/services/categories").then((r) => r.data),
  trending: (city) =>
    api.get("/services/trending", { params: { city } }).then((r) => r.data),
  autocomplete: (q) =>
    api.get("/services/autocomplete", { params: { q } }).then((r) => r.data),
};

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const hospitalsApi = {
  list: (params) => api.get("/hospitals", { params }).then((r) => r.data),
  get: (id) => api.get(`/hospitals/${id}`).then((r) => r.data),
  services: (id, params) =>
    api.get(`/hospitals/${id}/services`, { params }).then((r) => r.data),
  reviews: (id, params) =>
    api.get(`/hospitals/${id}/reviews`, { params }).then((r) => r.data),
  slots: (id, params) =>
    api.get(`/hospitals/${id}/slots`, { params }).then((r) => r.data),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data) => api.post("/bookings", data).then((r) => r.data),
  get: (id) => api.get(`/bookings/${id}`).then((r) => r.data),
  list: (params) => api.get("/bookings", { params }).then((r) => r.data),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`).then((r) => r.data),
  review: (id, data) =>
    api.post(`/bookings/${id}/review`, data).then((r) => r.data),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (bookingId) =>
    api.post("/payments/order", { bookingId }).then((r) => r.data),
  verify: (data) => api.post("/payments/verify", data).then((r) => r.data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: (hospitalId) =>
    api.get(`/admin/${hospitalId}/dashboard`).then((r) => r.data),
  services: (hospitalId) =>
    api.get(`/admin/${hospitalId}/services`).then((r) => r.data),
  updateService: (hospitalId, serviceId, data) =>
    api
      .put(`/admin/${hospitalId}/services/${serviceId}`, data)
      .then((r) => r.data),
  addService: (hospitalId, data) =>
    api.post(`/admin/${hospitalId}/services`, data).then((r) => r.data),
  bookings: (hospitalId, params) =>
    api.get(`/admin/${hospitalId}/bookings`, { params }).then((r) => r.data),
  updateBookingStatus: (hospitalId, bookingId, status) =>
    api
      .patch(`/admin/${hospitalId}/bookings/${bookingId}/status`, { status })
      .then((r) => r.data),
};
