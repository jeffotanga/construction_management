import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

export const projectService = {
  getAll: () => api.get('/projects'),
  create: (projectData) => api.post('/projects', projectData),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  assignWorker: (projectId, payload) => api.post(`/projects/${projectId}/assign-worker`, payload),
};

export const workerService = {
  getAll: () => api.get('/workers'),
  create: (workerData) => api.post('/workers', workerData),
  assign: (workerId, payload) => api.post(`/workers/${workerId}/assign`, payload),
};

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  create: (attendanceData) => api.post('/attendance', attendanceData),
  summary: (params) => api.get('/attendance/summary', { params }),
};

export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  create: (payload) => api.post('/payments', payload),
  update: (id, payload) => api.put(`/payments/${id}`, payload),
};

export const reportService = {
  projectSummary: (projectId) => api.get(`/reports/project-summary/${projectId}`, { responseType: 'blob' }),
  financial: (projectId) => api.get(`/reports/financial/${projectId}`, { responseType: 'blob' }),
  attendance: (projectId) => api.get(`/reports/attendance/${projectId}`, { responseType: 'blob' }),
};

export default api;
