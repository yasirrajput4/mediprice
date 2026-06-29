import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  // Import store inline to avoid circular deps
  const raw = localStorage.getItem('mediprice-auth');
  if (raw) {
    const { state } = JSON.parse(raw);
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const raw = localStorage.getItem('mediprice-auth');
        const { state } = JSON.parse(raw || '{}');
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: state?.refreshToken }
        );

        // Update stored tokens
        const updated = { ...state, accessToken: data.accessToken, refreshToken: data.refreshToken };
        localStorage.setItem('mediprice-auth', JSON.stringify({ state: updated }));

        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        localStorage.removeItem('mediprice-auth');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
