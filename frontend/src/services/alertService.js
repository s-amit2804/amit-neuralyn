import api from './api';

export async function getAlerts(params = {}) {
  const response = await api.get('/alerts', { params });
  return response.data.data;
}

export async function acknowledgeAlert(id) {
  const response = await api.put(`/alerts/${id}/acknowledge`);
  return response.data.data;
}

export async function resolveAlert(id, resolutionNotes) {
  const response = await api.put(`/alerts/${id}/resolve`, { resolutionNotes });
  return response.data.data;
}
