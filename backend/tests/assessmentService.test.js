const test = require('node:test');
const assert = require('node:assert/strict');

const {
  classifyIssueCategory,
  toLegacyNextStep,
} = require('../services/assessmentService');

test('classifyIssueCategory maps academic language to academic', () => {
  assert.equal(
    classifyIssueCategory('I am stressed about exams and school grades'),
    'academic'
  );
});

test('classifyIssueCategory maps loneliness language to social', () => {
  assert.equal(
    classifyIssueCategory('I feel lonely, alone, and socially disconnected'),
    'social'
  );
});

test('toLegacyNextStep keeps compatibility mapping', () => {
  assert.equal(toLegacyNextStep('high'), 'ngo_alerted');
  assert.equal(toLegacyNextStep('medium'), 'user_choice');
  assert.equal(toLegacyNextStep('low'), 'self_manage');
});
