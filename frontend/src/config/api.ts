// API Configuration for HireByte
// Automatically detects the correct backend URL based on how the frontend is accessed

// Get the current hostname (works for both localhost and network IP)
// Hardcoded to localhost for debugging
// Force 127.0.0.1 if localhost to avoid IPv6 resolution issues on Windows
const currentHost = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
const API_BASE_URL = `http://${currentHost}:9000`;

console.log('HireByte API Config (Hardcoded):', {
  apiUrl: API_BASE_URL,
  originalEnvVar: import.meta.env.VITE_API_URL
});

export const API_ENDPOINTS = {
  uploadResume: `${API_BASE_URL}/upload-resume`,
  startTopicInterview: `${API_BASE_URL}/start-topic-interview`,
  transcribe: `${API_BASE_URL}/transcribe`,
  getHint: `${API_BASE_URL}/get-hint`,
  stream: `${API_BASE_URL}/api/stream`,
  stopCamera: `${API_BASE_URL}/api/stop-camera`,
  analytics: `${API_BASE_URL}/api/analytics`,
  analyticsTimeline: `${API_BASE_URL}/api/analytics/timeline`,
  analyticsFeedback: `${API_BASE_URL}/api/analytics/feedback`,
  health: `${API_BASE_URL}/health`,
};

// WebSocket endpoints - replace http with ws
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

export const WS_ENDPOINTS = {
  interview: `${WS_BASE_URL}/ws/interview`,
  video: `${WS_BASE_URL}/ws/video`,
};

export default API_BASE_URL;
