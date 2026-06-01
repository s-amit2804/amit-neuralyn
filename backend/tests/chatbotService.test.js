const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateFallbackResponse,
  generateChatReply,
} = require('../services/chatbotService');

test('generateFallbackResponse returns urgent guidance for self-harm signals', { concurrency: false }, () => {
  const response = generateFallbackResponse('I want to end my life');
  assert.match(response.toLowerCase(), /urgent|trusted adult|crisis|emergency/);
});

test('generateChatReply falls back when OpenRouter key is unavailable', { concurrency: false }, async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;

  const reply = await generateChatReply(
    {
      messages: [{ sender: 'user', content: 'I feel stressed and alone.' }],
    },
    'I feel stressed and alone.'
  );

  assert.equal(typeof reply, 'string');
  assert.ok(reply.length > 0);

  if (previousKey) {
    process.env.OPENROUTER_API_KEY = previousKey;
  }
});

test('generateChatReply retries with the next model when OpenRouter returns 403', { concurrency: false }, async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousChatModel = process.env.CHAT_MODEL_ID;
  const previousClaudeModel = process.env.CLAUDE_MODEL_ID;
  const previousFetch = global.fetch;

  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.CHAT_MODEL_ID = 'blocked/model';
  process.env.CLAUDE_MODEL_ID = 'working/model';

  let callCount = 0;
  global.fetch = async (_url, options) => {
    callCount += 1;
    const payload = JSON.parse(options.body);

    if (payload.model === 'blocked/model') {
      return {
        ok: false,
        status: 403,
        text: async () => 'forbidden',
      };
    }

    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Backend LLM reply',
            },
          },
        ],
      }),
    };
  };

  const reply = await generateChatReply(
    {
      messages: [{ sender: 'user', content: 'I feel stressed and alone.' }],
    },
    'I feel stressed and alone.'
  );

  assert.equal(reply, 'Backend LLM reply');
  assert.equal(callCount, 2);

  global.fetch = previousFetch;
  if (previousKey) process.env.OPENROUTER_API_KEY = previousKey;
  else delete process.env.OPENROUTER_API_KEY;
  if (previousChatModel) process.env.CHAT_MODEL_ID = previousChatModel;
  else delete process.env.CHAT_MODEL_ID;
  if (previousClaudeModel) process.env.CLAUDE_MODEL_ID = previousClaudeModel;
  else delete process.env.CLAUDE_MODEL_ID;
});

test('generateChatReply retries with the next model when the first model times out', { concurrency: false }, async () => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousChatModel = process.env.CHAT_MODEL_ID;
  const previousFallbackModel = process.env.CHAT_FALLBACK_MODEL_ID;
  const previousFetch = global.fetch;

  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.CHAT_MODEL_ID = 'slow/model';
  process.env.CHAT_FALLBACK_MODEL_ID = 'fast/model';

  let callCount = 0;
  global.fetch = async (_url, options) => {
    callCount += 1;
    const payload = JSON.parse(options.body);

    if (payload.model === 'slow/model') {
      const error = new Error('The operation timed out');
      error.name = 'TimeoutError';
      throw error;
    }

    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Fast fallback reply',
            },
          },
        ],
      }),
    };
  };

  const reply = await generateChatReply(
    {
      messages: [{ sender: 'user', content: 'I feel overwhelmed.' }],
    },
    'I feel overwhelmed.'
  );

  assert.equal(reply, 'Fast fallback reply');
  assert.equal(callCount, 2);

  global.fetch = previousFetch;
  if (previousKey) process.env.OPENROUTER_API_KEY = previousKey;
  else delete process.env.OPENROUTER_API_KEY;
  if (previousChatModel) process.env.CHAT_MODEL_ID = previousChatModel;
  else delete process.env.CHAT_MODEL_ID;
  if (previousFallbackModel) process.env.CHAT_FALLBACK_MODEL_ID = previousFallbackModel;
  else delete process.env.CHAT_FALLBACK_MODEL_ID;
});
