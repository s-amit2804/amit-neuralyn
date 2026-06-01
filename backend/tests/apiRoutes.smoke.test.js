const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.NODE_ENV = 'test';
process.env.OPENROUTER_API_KEY = '';

const { app } = require('../server');
const User = require('../models/User');
const Organization = require('../models/Organization');
const MentorAvailability = require('../models/MentorAvailability');
const ChatSession = require('../models/ChatSession');
const Session = require('../models/Session');
const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');

const createdIds = {
  organizationId: null,
  userIds: [],
  availabilityIds: [],
  chatIds: [],
  sessionIds: [],
  assessmentIds: [],
  alertIds: [],
};

let server;
let baseUrl;

const ensureServerStarted = async () => {
  if (baseUrl) {
    return;
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
};

const request = async (method, route, { token, body } = {}) => {
  await ensureServerStarted();

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  return { response, payload };
};

after(async () => {
  if (createdIds.alertIds.length) {
    await Alert.deleteMany({ _id: { $in: createdIds.alertIds } });
  }
  if (createdIds.assessmentIds.length) {
    await Assessment.deleteMany({ _id: { $in: createdIds.assessmentIds } });
  }
  if (createdIds.sessionIds.length) {
    await Session.deleteMany({ _id: { $in: createdIds.sessionIds } });
  }
  if (createdIds.chatIds.length) {
    await ChatSession.deleteMany({ _id: { $in: createdIds.chatIds } });
  }
  if (createdIds.availabilityIds.length) {
    await MentorAvailability.deleteMany({ _id: { $in: createdIds.availabilityIds } });
  }
  if (createdIds.userIds.length) {
    await User.deleteMany({ _id: { $in: createdIds.userIds } });
  }
  if (createdIds.organizationId) {
    await Organization.deleteOne({ _id: createdIds.organizationId });
  }

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  await mongoose.disconnect();
});

test('backend API smoke test covers the main routes end-to-end', { timeout: 240000 }, async () => {
  const unique = Date.now().toString();
  const organizationName = `MindBridge Test Org ${unique}`;
  const userEmail = `user_${unique}@mindbridge.test`;
  const mentorEmail = `mentor_${unique}@mindbridge.test`;
  const ngoEmail = `ngo_${unique}@mindbridge.test`;
  const password = 'password123';

  const createOrgResult = await request('POST', '/api/auth/organizations', {
    body: {
      name: organizationName,
      type: 'ngo',
      contactEmail: `contact_${unique}@mindbridge.test`,
      location: 'Bangalore',
    },
  });
  assert.equal(createOrgResult.response.status, 201);
  createdIds.organizationId = createOrgResult.payload.data._id;

  const organizationsResult = await request('GET', '/api/auth/organizations');
  assert.equal(organizationsResult.response.status, 200);
  assert.ok(
    organizationsResult.payload.data.some((org) => org._id === createdIds.organizationId)
  );

  const registerResult = await request('POST', '/api/auth/register', {
    body: {
      name: 'Test User',
      email: userEmail,
      password,
      organizationId: createdIds.organizationId,
      gender: 'male',
      language: 'en',
      ageGroup: '19-21',
    },
  });
  assert.equal(registerResult.response.status, 201);
  const userToken = registerResult.payload.data.token;
  const userId = registerResult.payload.data._id;
  createdIds.userIds.push(userId);

  const mentor = await User.create({
    name: 'Test Mentor',
    email: mentorEmail,
    password,
    role: 'mentor',
    organization: createdIds.organizationId,
    gender: 'female',
    language: 'en',
  });
  const ngo = await User.create({
    name: 'Test NGO',
    email: ngoEmail,
    password,
    role: 'ngo',
    organization: createdIds.organizationId,
    gender: 'male',
    language: 'en',
  });
  createdIds.userIds.push(mentor._id, ngo._id);

  const userLoginResult = await request('POST', '/api/auth/login', {
    body: { email: userEmail, password },
  });
  const mentorLoginResult = await request('POST', '/api/auth/login', {
    body: { email: mentorEmail, password },
  });
  const ngoLoginResult = await request('POST', '/api/auth/login', {
    body: { email: ngoEmail, password },
  });
  assert.equal(userLoginResult.response.status, 200);
  assert.equal(mentorLoginResult.response.status, 200);
  assert.equal(ngoLoginResult.response.status, 200);

  const mentorToken = mentorLoginResult.payload.data.token;
  const ngoToken = ngoLoginResult.payload.data.token;

  const meResult = await request('GET', '/api/auth/me', { token: userToken });
  assert.equal(meResult.response.status, 200);
  assert.equal(meResult.payload.data.email, userEmail);

  const today = new Date();
  today.setDate(today.getDate() + 7);
  const day = today.toISOString().slice(0, 10);

  const primaryAvailability = await request('POST', '/api/mentors/availability', {
    token: mentorToken,
    body: {
      date: day,
      slots: [
        { startTime: '10:00', endTime: '11:00' },
        { startTime: '12:00', endTime: '13:00' },
      ],
    },
  });
  assert.equal(primaryAvailability.response.status, 201);
  createdIds.availabilityIds.push(primaryAvailability.payload.data._id);

  const deleteAvailability = await request('POST', '/api/mentors/availability', {
    token: mentorToken,
    body: {
      date: new Date(today.getTime() + 86400000).toISOString().slice(0, 10),
      slots: [{ startTime: '14:00', endTime: '15:00' }],
    },
  });
  assert.equal(deleteAvailability.response.status, 201);
  createdIds.availabilityIds.push(deleteAvailability.payload.data._id);

  const myAvailabilityResult = await request('GET', '/api/mentors/availability/me', {
    token: mentorToken,
  });
  assert.equal(myAvailabilityResult.response.status, 200);
  assert.ok(myAvailabilityResult.payload.data.length >= 2);

  const availableMentorsResult = await request(
    'GET',
    `/api/mentors?date=${day}&language=en&gender=female`,
    { token: userToken }
  );
  assert.equal(availableMentorsResult.response.status, 200);
  assert.ok(availableMentorsResult.payload.data.length >= 1);

  const bookSessionResult = await request('POST', '/api/sessions', {
    token: userToken,
    body: {
      availabilityId: primaryAvailability.payload.data._id,
      slotIndex: 0,
      languagePreference: 'en',
      genderPreference: 'female',
    },
  });
  assert.equal(bookSessionResult.response.status, 201);
  const sessionId = bookSessionResult.payload.data._id;
  createdIds.sessionIds.push(sessionId);

  const userSessionsResult = await request('GET', '/api/sessions', { token: userToken });
  const mentorSessionsResult = await request('GET', '/api/sessions/mentor', {
    token: mentorToken,
  });
  assert.equal(userSessionsResult.response.status, 200);
  assert.equal(mentorSessionsResult.response.status, 200);
  assert.ok(userSessionsResult.payload.data.some((session) => session._id === sessionId));
  assert.ok(mentorSessionsResult.payload.data.some((session) => session._id === sessionId));

  const meetLinkResult = await request('PUT', `/api/sessions/${sessionId}/meetlink`, {
    token: mentorToken,
    body: { meetLink: 'https://meet.google.com/test-link' },
  });
  assert.equal(meetLinkResult.response.status, 200);

  const completeSessionResult = await request('PUT', `/api/sessions/${sessionId}/complete`, {
    token: mentorToken,
    body: {
      notes: 'The user discussed stress, loneliness, and pressure from exams.',
    },
  });
  assert.equal(completeSessionResult.response.status, 200);
  createdIds.assessmentIds.push(completeSessionResult.payload.data.assessmentId);

  const startChatResult = await request('POST', '/api/chat', { token: userToken });
  assert.equal(startChatResult.response.status, 201);
  const chatId = startChatResult.payload.data._id;
  createdIds.chatIds.push(chatId);

  const sendMessageResult = await request('POST', `/api/chat/${chatId}/message`, {
    token: userToken,
    body: { content: 'I feel stressed and alone because of exams.' },
  });
  assert.equal(sendMessageResult.response.status, 200);

  const chatsResult = await request('GET', '/api/chat', { token: userToken });
  const chatResult = await request('GET', `/api/chat/${chatId}`, { token: userToken });
  assert.equal(chatsResult.response.status, 200);
  assert.equal(chatResult.response.status, 200);
  assert.ok(chatsResult.payload.data.some((chat) => chat._id === chatId));

  const endChatResult = await request('PUT', `/api/chat/${chatId}/end`, {
    token: userToken,
  });
  assert.equal(endChatResult.response.status, 200);
  createdIds.assessmentIds.push(endChatResult.payload.data.assessmentId);

  const mediumAssessmentResult = await request('POST', '/api/assessment/analyze', {
    token: userToken,
    body: {
      text: 'I feel very stressed and alone because of exams and social pressure.',
    },
  });
  assert.equal(mediumAssessmentResult.response.status, 201);
  const mediumAssessmentId = mediumAssessmentResult.payload.data.assessmentId;
  createdIds.assessmentIds.push(mediumAssessmentId);

  const audioBase64 = fs.readFileSync(
    path.join(__dirname, '..', '..', 'test-audio.mpeg')
  ).toString('base64');
  const audioAssessmentResult = await request('POST', '/api/assessment/analyze', {
    token: userToken,
    body: {
      audioBase64,
      audioFileName: 'test-audio.mpeg',
    },
  });
  assert.equal(audioAssessmentResult.response.status, 201);
  createdIds.assessmentIds.push(audioAssessmentResult.payload.data.assessmentId);

  const highAssessmentResult = await request('POST', '/api/assessment/classify', {
    token: userToken,
    body: {
      text: 'I want to end my life and nobody cares about me anymore.',
    },
  });
  assert.equal(highAssessmentResult.response.status, 201);
  const highAssessmentId = highAssessmentResult.payload.data.assessmentId;
  createdIds.assessmentIds.push(highAssessmentId);
  assert.equal(highAssessmentResult.payload.data.intensityLevel, 'high');

  const myAssessmentsResult = await request('GET', '/api/assessment', { token: userToken });
  const ngoAssessmentsResult = await request('GET', '/api/assessment', { token: ngoToken });
  assert.equal(myAssessmentsResult.response.status, 200);
  assert.equal(ngoAssessmentsResult.response.status, 200);
  assert.ok(myAssessmentsResult.payload.data.length >= 4);

  const assessmentResult = await request('GET', `/api/assessment/${mediumAssessmentId}`, {
    token: userToken,
  });
  const ngoAssessmentResult = await request('GET', `/api/assessment/${mediumAssessmentId}`, {
    token: ngoToken,
  });
  assert.equal(assessmentResult.response.status, 200);
  assert.equal(ngoAssessmentResult.response.status, 200);

  const sendAlertResult = await request('POST', '/api/alerts', {
    token: userToken,
    body: { assessmentId: mediumAssessmentId },
  });
  assert.equal(sendAlertResult.response.status, 201);
  const userRequestedAlertId = sendAlertResult.payload.data._id;
  createdIds.alertIds.push(userRequestedAlertId);

  const alertListResult = await request('GET', '/api/alerts', { token: ngoToken });
  assert.equal(alertListResult.response.status, 200);
  assert.ok(alertListResult.payload.data.length >= 1);

  const autoHighAlert = alertListResult.payload.data.find(
    (alert) => alert.assessment && alert.assessment._id === highAssessmentId
  );
  if (autoHighAlert) {
    createdIds.alertIds.push(autoHighAlert._id);
  }

  const acknowledgeAlertResult = await request(
    'PUT',
    `/api/alerts/${userRequestedAlertId}/acknowledge`,
    {
      token: ngoToken,
    }
  );
  assert.equal(acknowledgeAlertResult.response.status, 200);

  const resolveAlertResult = await request(
    'PUT',
    `/api/alerts/${userRequestedAlertId}/resolve`,
    {
      token: ngoToken,
      body: { resolutionNotes: 'Reached out to the user and scheduled follow-up.' },
    }
  );
  assert.equal(resolveAlertResult.response.status, 200);

  const dashboardStats = await request('GET', '/api/dashboard/stats', { token: ngoToken });
  const issuesByAge = await request('GET', '/api/dashboard/issues-by-age', { token: ngoToken });
  const issuesByOrg = await request('GET', '/api/dashboard/issues-by-org', { token: ngoToken });
  const intensityDistribution = await request(
    'GET',
    '/api/dashboard/intensity-distribution',
    { token: ngoToken }
  );
  const alertsTrend = await request('GET', '/api/dashboard/alerts-trend', {
    token: ngoToken,
  });
  const activityTrend = await request('GET', '/api/dashboard/activity-trend', {
    token: ngoToken,
  });

  assert.equal(dashboardStats.response.status, 200);
  assert.equal(issuesByAge.response.status, 200);
  assert.equal(issuesByOrg.response.status, 200);
  assert.equal(intensityDistribution.response.status, 200);
  assert.equal(alertsTrend.response.status, 200);
  assert.equal(activityTrend.response.status, 200);

  const deleteAvailabilityResult = await request(
    'DELETE',
    `/api/mentors/availability/${deleteAvailability.payload.data._id}`,
    { token: mentorToken }
  );
  assert.equal(deleteAvailabilityResult.response.status, 200);
});
