import { Request, Response } from 'express';

/**
 * Detects which AI provider to emulate based on request headers
 * Defaults to OpenAI if no specific headers are found
 */
function detectProvider(req: Request): 'openai' | 'anthropic' | 'gemini' {
  const headers = req.headers;

  // Check for Anthropic-specific headers
  if (headers['x-api-key'] || headers['anthropic-version']) {
    return 'anthropic';
  }

  // Check for Gemini-specific headers or query params
  if (headers['x-goog-api-key'] || req.query.key) {
    return 'gemini';
  }

  // Default to OpenAI
  return 'openai';
}

/**
 * Returns fake OpenAI models list
 */
function getOpenAIModels() {
  return {
    object: 'list',
    data: [
      {
        id: 'gpt-4o',
        object: 'model',
        created: 1715367049,
        owned_by: 'system',
      },
      {
        id: 'gpt-4o-mini',
        object: 'model',
        created: 1721172741,
        owned_by: 'system',
      },
      {
        id: 'gpt-4-turbo',
        object: 'model',
        created: 1712361441,
        owned_by: 'system',
      },
      {
        id: 'gpt-4',
        object: 'model',
        created: 1687882411,
        owned_by: 'openai',
      },
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
      },
      {
        id: 'o1-preview',
        object: 'model',
        created: 1725648070,
        owned_by: 'system',
      },
      {
        id: 'o1-mini',
        object: 'model',
        created: 1725648069,
        owned_by: 'system',
      },
    ],
  };
}

/**
 * Returns fake Anthropic models list
 */
function getAnthropicModels() {
  return {
    data: [
      {
        id: 'claude-sonnet-4-5-20250929',
        display_name: 'Claude Sonnet 4.5',
        created_at: '2025-09-29T00:00:00Z',
        type: 'model',
      },
      {
        id: 'claude-sonnet-4-20250514',
        display_name: 'Claude Sonnet 4',
        created_at: '2025-05-14T00:00:00Z',
        type: 'model',
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        display_name: 'Claude 3.5 Sonnet',
        created_at: '2024-10-22T00:00:00Z',
        type: 'model',
      },
      {
        id: 'claude-3-5-haiku-20241022',
        display_name: 'Claude 3.5 Haiku',
        created_at: '2024-10-22T00:00:00Z',
        type: 'model',
      },
      {
        id: 'claude-3-opus-20240229',
        display_name: 'Claude 3 Opus',
        created_at: '2024-02-29T00:00:00Z',
        type: 'model',
      },
    ],
    first_id: 'claude-sonnet-4-5-20250929',
    has_more: false,
    last_id: 'claude-3-opus-20240229',
  };
}

/**
 * Returns fake Gemini models list
 */
function getGeminiModels() {
  return {
    models: [
      {
        name: 'models/gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        description: 'Fast and versatile performance across a diverse variety of tasks',
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens'],
        temperature: 1.0,
        maxTemperature: 2.0,
        topP: 0.95,
        topK: 64,
      },
      {
        name: 'models/gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash Experimental',
        description: 'Experimental multimodal model with advanced capabilities',
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens'],
        temperature: 1.0,
        maxTemperature: 2.0,
        topP: 0.95,
        topK: 40,
      },
      {
        name: 'models/gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Mid-size multimodal model that supports up to 2 million tokens',
        inputTokenLimit: 2097152,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens'],
        temperature: 1.0,
        maxTemperature: 2.0,
        topP: 0.95,
        topK: 64,
      },
      {
        name: 'models/gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and versatile multimodal model for scaling across diverse tasks',
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens'],
        temperature: 1.0,
        maxTemperature: 2.0,
        topP: 0.95,
        topK: 64,
      },
      {
        name: 'models/gemini-1.5-flash-8b',
        displayName: 'Gemini 1.5 Flash-8B',
        description: 'Smaller, faster model for high-frequency tasks',
        inputTokenLimit: 1048576,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens'],
        temperature: 1.0,
        maxTemperature: 2.0,
        topP: 0.95,
        topK: 40,
      },
    ],
  };
}

/**
 * GET /models endpoint handler
 * Returns a fake list of models based on the detected provider
 * Provider detection uses request headers:
 * - Anthropic: x-api-key or anthropic-version headers
 * - Gemini: x-goog-api-key header or 'key' query parameter
 * - OpenAI: default fallback
 */
export async function getModels(req: Request, res: Response): Promise<void> {
  try {
    const provider = detectProvider(req);

    let response;
    switch (provider) {
      case 'anthropic':
        response = getAnthropicModels();
        break;
      case 'gemini':
        response = getGeminiModels();
        break;
      case 'openai':
      default:
        response = getOpenAIModels();
        break;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in get models:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
