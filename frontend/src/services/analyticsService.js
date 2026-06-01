import api from './api';

export async function getDashboardStats() {
  const response = await api.get('/dashboard/stats');
  return response.data.data;
}

export async function getIssuesByAge() {
  const response = await api.get('/dashboard/issues-by-age');
  return response.data.data;
}

export async function getIssuesByOrganization() {
  const response = await api.get('/dashboard/issues-by-org');
  return response.data.data;
}

export async function getIntensityDistribution() {
  const response = await api.get('/dashboard/intensity-distribution');
  return response.data.data;
}

export async function getAlertsTrend() {
  const response = await api.get('/dashboard/alerts-trend');
  return response.data.data;
}

export async function getActivityTrend() {
  const response = await api.get('/dashboard/activity-trend');
  return response.data.data;
}

export async function getNgoDashboardData() {
  const [
    stats,
    issuesByAge,
    issuesByOrganization,
    intensityDistribution,
    alertsTrend,
    activityTrend,
  ] = await Promise.all([
    getDashboardStats(),
    getIssuesByAge(),
    getIssuesByOrganization(),
    getIntensityDistribution(),
    getAlertsTrend(),
    getActivityTrend(),
  ]);

  return {
    stats,
    issuesByAge,
    issuesByOrganization,
    intensityDistribution,
    alertsTrend,
    activityTrend,
  };
}
