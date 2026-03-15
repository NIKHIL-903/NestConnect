import axios from 'axios';

export let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token
};

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,
});


api.interceptors.request.use((config) => {

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// api calls for user auth
export const loginUser = (data) => api.post('/auth/login', data);

export const registerUser = (data) => api.post('/auth/register', data);
export const refreshTokenApi = (refreshToken) => api.post('/auth/refresh-token', { refreshToken });

export const logoutUser = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Org
export const registerOrg = (data) => api.post('/org', data);
export const checkOrgCode = (code) => api.get(`/org/check/${code}`);
export const getOrganization = (orgCode) => api.get(`/org/${orgCode}`);

// User
export const getDiscoverUsers = (domain, type, page, limit) => 
  api.get('/discover', { params: { domain, type, page, limit } });
export const getUserProfile = (userId) => api.get(`/users/${userId}`);
export const checkUserId = (userId) => api.get(`/users/check-userid/${userId}`);
export const updateProfile = (data) => api.patch('/users/profile', data);

// Connection
export const sendConnectionRequest = (receiverUserId) => api.post('/connections', { receiverUserId });
export const getPendingRequests = () => api.get('/connections/requests');
export const getConnections = () => api.get('/connections');
export const acceptRequest = (userId) => api.patch(`/connections/${userId}/accept`);
export const rejectRequest = (userId) => api.patch(`/connections/${userId}/reject`);
export const removeConnection = (userId) => api.delete(`/connections/${userId}`);

// Message
export const getChatHistory = (connectionId) => api.get(`/messages/${connectionId}`);

export default api;
