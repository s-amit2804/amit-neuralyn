import api from './api';

export async function loginUser({ email, password }) {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
}

export async function registerUser(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.data;
}

export async function updateCurrentUser(payload) {
  const response = await api.put('/auth/me', payload);
  return response.data.data;
}

export async function getOrganizations() {
  const response = await api.get('/auth/organizations');
  return response.data.data;
}

export async function createOrganization(payload) {
  const response = await api.post('/auth/organizations', payload);
  return response.data.data;
}
