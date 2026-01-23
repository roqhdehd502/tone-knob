export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const REALTIME_WS_URL: string =
  import.meta.env.VITE_REALTIME_WS_URL ?? "ws://localhost:3001/ws";
