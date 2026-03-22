const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  SCHEMA_SUMMARY,
  INTENT_EXTRACTION_SYSTEM_PROMPT,
  RESULT_SUMMARY_SYSTEM_PROMPT
} = require('../prompts/assistantPrompts');

const DEFAULT_INTENT = {
  intent: 'unsupported',
  workerType: null,
  rankingBy: null,
  limit: 5,
  workerName: null,
  category: null
};

const ALLOWED_INTENTS = new Set([
  'top_workers',
  'most_active_workers',
  'worker_feedback_summary',
  'worker_lookup',
  'unsupported'
]);

const ALLOWED_RANKING = new Set(['rating', 'request_count', 'feedback', null]);

function coerceLimit(value) {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(Math.floor(n), 20);
}

function normalizeIntent(raw) {
  const payload = raw && typeof raw === 'object' ? raw : {};
  const safeLimit = coerceLimit(payload.limit);

  const normalized = {
    intent: ALLOWED_INTENTS.has(payload.intent) ? payload.intent : 'unsupported',
    workerType: typeof payload.workerType === 'string' && payload.workerType.trim()
      ? payload.workerType.trim().toLowerCase()
      : null,
    rankingBy: ALLOWED_RANKING.has(payload.rankingBy) ? payload.rankingBy : null,
    limit: safeLimit,
    workerName: typeof payload.workerName === 'string' && payload.workerName.trim()
      ? payload.workerName.trim()
      : null,
    category: typeof payload.category === 'string' && payload.category.trim()
      ? payload.category.trim().toLowerCase()
      : null
  };

  if (!normalized.category && normalized.workerType) {
    normalized.category = normalized.workerType;
  }

  return normalized;
}

function extractJsonObject(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch (innerError) {
        return null;
      }
    }

    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch (sliceError) {
        return null;
      }
    }
    return null;
  }
}

function buildPromptFromMessages(messages) {
  if (!Array.isArray(messages)) return '';
  return messages
    .map(message => {
      const role = message?.role || 'user';
      const content = message?.content || '';
      return `${role.toUpperCase()}:\n${content}`;
    })
    .join('\n\n');
}

function extractGeminiText(response) {
  if (!response) return '';
  try {
    const text = response.text();
    return typeof text === 'string' ? text : '';
  } catch (err) {
    const parts = response.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const joined = parts.map(p => p?.text || '').join('');
      if (joined) return joined;
    }
    console.error('Gemini response had no extractable text:', err?.message || err);
    return '';
  }
}

async function callChatModel(messages, { temperature = 0.1, maxTokens = 400 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  // Override with AI_MODEL in server/.env (e.g. gemini-2.0-flash, gemini-1.5-flash)
  const modelName = process.env.AI_MODEL || 'gemini-2.0-flash';

  if (!apiKey) {
    throw new Error('AI_PROVIDER_NOT_CONFIGURED');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  });

  const prompt = buildPromptFromMessages(messages);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return extractGeminiText(response);
}

async function extractIntent(message) {
  if (!message || typeof message !== 'string') {
    return { ...DEFAULT_INTENT };
  }

  try {
    const rawContent = await callChatModel(
      [
        {
          role: 'system',
          content: `${INTENT_EXTRACTION_SYSTEM_PROMPT}\n\n${SCHEMA_SUMMARY}`
        },
        {
          role: 'user',
          content: `Resident question: "${message.trim()}"`
        }
      ],
      { temperature: 0, maxTokens: 250 }
    );
    const parsed = extractJsonObject(rawContent);
    return normalizeIntent(parsed || DEFAULT_INTENT);
  } catch (error) {
    console.error('extractIntent error:', error?.message || error);
    return { ...DEFAULT_INTENT };
  }
}

async function summarizeResults(originalMessage, intent, results) {
  const fallbackReply = results?.count > 0
    ? 'I found matching workers and service insights based on your request.'
    : 'I could not find matching workers or feedback for that request yet.';

  try {
    const rawContent = await callChatModel(
      [
        { role: 'system', content: RESULT_SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            originalMessage,
            intent,
            results
          })
        }
      ],
      { temperature: 0.3, maxTokens: 220 }
    );
    return rawContent?.trim() || fallbackReply;
  } catch (error) {
    console.error('summarizeResults error:', error?.message || error);
    return fallbackReply;
  }
}

module.exports = {
  extractIntent,
  summarizeResults
};
