import api from './api';

export async function getAssessments() {
  const response = await api.get('/assessment');
  return response.data.data;
}

export async function analyzeText(text) {
  const response = await api.post('/assessment/analyze', { text });
  return response.data.data;
}

export async function requestHelpAlert(assessmentId) {
  const response = await api.post('/alerts', { assessmentId });
  return response.data;
}

export async function getAssessment(id) {
  const response = await api.get(`/assessment/${id}`);
  return response.data.data;
}
