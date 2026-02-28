const axios = require('axios');

const apiFootball = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-rapidapi-key': process.env.RAPID_API_KEY,
    'x-rapidapi-host': 'v3.football.api-sports.io',
  },
  timeout: 10000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
apiFootball.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    const params = new URLSearchParams(config.params).toString();
    console.log(`[API-Football] --> ${config.method?.toUpperCase()} ${config.url}${params ? '?' + params : ''}`);
  }
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
apiFootball.interceptors.response.use(
  (response) => {
    // Surface API-Football's own error field (status 200 with errors array)
    const { errors } = response.data;
    if (errors && Object.keys(errors).length > 0) {
      const message = Object.values(errors).join(', ');
      const err = new Error(`API-Football error: ${message}`);
      err.status = 502;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`[API-Football] <-- Error ${status}: ${message}`);

    if (status === 429) {
      const rateLimitErr = new Error('API-Football rate limit exceeded');
      rateLimitErr.status = 429;
      return Promise.reject(rateLimitErr);
    }

    return Promise.reject(error);
  }
);

module.exports = apiFootball;
