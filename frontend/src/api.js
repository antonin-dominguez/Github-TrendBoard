import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const fetchTrends = (params) => api.get("/trends", { params }).then((r) => r.data);
export const fetchTrend = (id) => api.get(`/trends/${id}`).then((r) => r.data);
export const fetchAnalysis = (id) => api.get(`/trends/${id}/analysis`).then((r) => r.data);
export const fetchSummary = (period, source) => api.get("/summary", { params: { period, ...(source ? { source } : {}) } }).then((r) => r.data);
export const fetchFavorites = () => api.get("/favorites").then((r) => r.data);
export const addFavorite = (item_id, note) => api.post("/favorites", { item_id, note }).then((r) => r.data);
export const removeFavorite = (id) => api.delete(`/favorites/${id}`);
export const fetchStats = () => api.get("/stats").then((r) => r.data);
export const triggerRefresh = () => api.post("/refresh").then((r) => r.data);
export const fetchSettings = () => api.get("/settings").then((r) => r.data);
export const updateSettings = (interests) => api.put("/settings", interests).then((r) => r.data);
