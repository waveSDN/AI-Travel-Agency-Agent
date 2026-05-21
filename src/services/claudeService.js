const Anthropic = require('@anthropic-ai/sdk');
const { claude: config } = require('../config/env');
const { AIServiceError } = require('../utils/errors');
const logger = require('../utils/logger');
const eventBus = require('../events/eventBus');

let anthropicClient = null;

function getClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: config.apiKey });
  }
  return anthropicClient;
}

async function chat({ systemPrompt, messages, maxTokens }) {
  const client = getClient();

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens || config.maxTokens,
      system: systemPrompt,
      messages,
    });

    if (!response.content || response.content.length === 0) {
      throw new AIServiceError('Empty response from Claude');
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      usage: response.usage,
      stopReason: response.stop_reason,
    };
  } catch (err) {
    if (err instanceof AIServiceError) throw err;

    if (err.status === 429) {
      throw new AIServiceError('Claude rate limit reached — please retry shortly');
    }
    if (err.status >= 500) {
      throw new AIServiceError('Claude API is temporarily unavailable');
    }

    logger.error('Claude API error', { error: err.message, status: err.status });
    throw new AIServiceError(`Claude API error: ${err.message}`);
  }
}

async function extractJSON(prompt) {
  const result = await chat({
    systemPrompt: 'You are a structured data extraction engine. Always respond with valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 512,
  });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    logger.warn('JSON parse failed from Claude response', { raw: result.text });
    return null;
  }
}

module.exports = { chat, extractJSON };
