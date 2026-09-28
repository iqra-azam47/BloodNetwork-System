import axios from "axios";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }
    return `https://${raw}`;
  }
  // Default to local ASP.NET Core dev port
  return "http://localhost:5218";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("bloodnetwork_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // If unauthorized and on protected page, clear token
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register" && path !== "/") {
        localStorage.removeItem("bloodnetwork_token");
        localStorage.removeItem("bloodnetwork_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
