const DEFAULT_API_BASE_URL = "http://localhost:5002/api/v1";

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_API_BASE_URL;

export const SOCKET_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");
