import api from './api';

const sortSlots = (slots) =>
  [...slots].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

export function flattenAvailability(availability = []) {
  return sortSlots(
    availability.flatMap((entry) =>
      entry.slots
        .map((slot, index) => ({
          availabilityId: entry._id,
          mentorId: entry.mentor?._id,
          mentorName: entry.mentor?.name || 'Mentor',
          mentorLanguage: entry.mentor?.language || entry.language || 'en',
          mentorGender: entry.mentor?.gender || entry.gender || 'prefer_not_to_say',
          organization: entry.mentor?.organization?.name || '',
          date: entry.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotIndex: index,
          isBooked: slot.isBooked,
        }))
        .filter((slot) => !slot.isBooked)
    )
  );
}

export async function getUserSessions() {
  const response = await api.get('/sessions');
  return response.data.data;
}

export async function getAssignedSessions() {
  const response = await api.get('/sessions/mentor');
  return response.data.data;
}

export async function getAvailableMentors({ date, language, gender } = {}) {
  const params = new URLSearchParams();

  if (date) params.set('date', date);
  if (language) params.set('language', language);
  if (gender) params.set('gender', gender);

  const response = await api.get(`/mentors?${params.toString()}`);
  return response.data.data;
}

export async function bookMentorSession(payload) {
  const response = await api.post('/sessions', payload);
  return response.data.data;
}

export async function getMentorAvailability() {
  const response = await api.get('/mentors/availability/me');
  return response.data.data;
}

export async function publishAvailability(payload) {
  const response = await api.post('/mentors/availability', payload);
  return response.data.data;
}

export async function deleteAvailability(id) {
  const response = await api.delete(`/mentors/availability/${id}`);
  return response.data;
}

export async function saveMeetLink(sessionId, meetLink) {
  const response = await api.put(`/sessions/${sessionId}/meetlink`, { meetLink });
  return response.data.data;
}

export async function completeMentorSession(sessionId, payload) {
  const response = await api.put(`/sessions/${sessionId}/complete`, payload);
  return response.data.data;
}

export async function getEscalatedCases() {
  const response = await api.get('/mentors/escalated');
  return response.data.data;
}

export async function claimEscalatedCase(alertId) {
  const response = await api.put(`/mentors/escalated/${alertId}/claim`);
  return response.data.data;
}
