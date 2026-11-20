// ============================================================================
// GYMGUIDE - API CLIENT SERVICE (Axios with Response Validation & Cache Invalidation)
// Connects to NestJS /api/v1 endpoints + Admin Video Management endpoints
// ============================================================================

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const responseCache = new Map();
const CACHE_TTL_MS = 45 * 1000;

function getCached(key) {
  const hit = responseCache.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return hit.data;
  }
  return null;
}

function setCached(key, data) {
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearApiCache() {
  responseCache.clear();
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && body.success !== undefined) {
      return body;
    }
    return { success: true, data: body };
  },
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Unable to communicate with GymGuide server.';
    return Promise.reject(new Error(message));
  }
);

export const gymGuideApi = {
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },

  async getMuscles(params = {}) {
    const cacheKey = `muscles:${JSON.stringify(params)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get('/muscles', { params });
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getMuscleGroups() {
    const cacheKey = 'muscle-groups';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get('/muscles/groups');
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getMuscleById(idOrSlug) {
    const cacheKey = `muscle:${idOrSlug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get(`/muscles/${encodeURIComponent(idOrSlug)}`);
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getMuscleExercises(idOrSlug, role = 'ALL') {
    const cacheKey = `muscle-ex:${idOrSlug}:${role}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get(
      `/muscles/${encodeURIComponent(idOrSlug)}/exercises`,
      { params: { role } }
    );
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getExercises(params = {}, skipCache = false) {
    const cacheKey = `exercises:${JSON.stringify(params)}`;
    if (!skipCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    const res = await apiClient.get('/exercises', { params });
    const result = {
      exercises: res.data || [],
      meta: res.meta || { total: (res.data || []).length, page: 1, totalPages: 1 },
    };
    setCached(cacheKey, result);
    return result;
  },

  async getExerciseById(idOrSlug, skipCache = false) {
    const cacheKey = `exercise:${idOrSlug}`;
    if (!skipCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    const res = await apiClient.get(`/exercises/${encodeURIComponent(idOrSlug)}`);
    setCached(cacheKey, res.data);
    return res.data;
  },

  async compareExercises(firstSlug, secondSlug) {
    const cacheKey = `compare:${firstSlug}:${secondSlug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get('/exercises/compare', {
      params: { first: firstSlug, second: secondSlug },
    });
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getEquipment() {
    const cacheKey = 'equipment';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get('/equipment');
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getWorkoutPlans(params = {}) {
    const cacheKey = `plans:${JSON.stringify(params)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get('/workout-plans', { params });
    setCached(cacheKey, res.data);
    return res.data;
  },

  async getWorkoutPlanById(idOrSlug) {
    const cacheKey = `plan:${idOrSlug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get(`/workout-plans/${encodeURIComponent(idOrSlug)}`);
    setCached(cacheKey, res.data);
    return res.data;
  },

  async search(query) {
    const res = await apiClient.get('/search', { params: { q: query } });
    return res.data;
  },

  // --- ADMIN EXERCISE VIDEO STUDIO ENDPOINTS ---
  async updateExerciseVideo(idOrSlug, payload) {
    const res = await apiClient.put(
      `/exercises/${encodeURIComponent(idOrSlug)}/video`,
      payload
    );
    clearApiCache();
    return res.data;
  },

  async uploadExerciseVideoFile(idOrSlug, payload) {
    const res = await apiClient.post(
      `/exercises/${encodeURIComponent(idOrSlug)}/video-file`,
      payload
    );
    clearApiCache();
    return res.data;
  },

  async removeExerciseVideo(idOrSlug) {
    const res = await apiClient.delete(
      `/exercises/${encodeURIComponent(idOrSlug)}/video`
    );
    clearApiCache();
    return res.data;
  },
};
