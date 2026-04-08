export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to determine WebSocket URL based on API URL
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/^https/, 'wss');
