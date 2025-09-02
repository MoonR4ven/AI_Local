import type { Handler } from '@netlify/functions';

const OLLAMA_API_URL = process.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';

export const handler: Handler = async (event) => {
  try {
    // Strip the function prefix to get the API path
    // Example: '/.netlify/functions/ollama-proxy/api/tags?limit=10' => '/api/tags?limit=10'
    const pathWithQuery = event.rawUrl.replace('/.netlify/functions/ollama-proxy', '') || '/api/tags';
    const url = `${OLLAMA_API_URL}${pathWithQuery}`;

    // Prepare fetch options
    const options: RequestInit = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Only attach body for non-GET requests
    if (event.httpMethod !== 'GET' && event.body) {
      options.body = event.body;
    }

    // Fetch from Ollama
    const response = await fetch(url, options);
    const text = await response.text();

    // Try parsing JSON, fallback to raw text
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Failed to parse JSON', raw: text };
    }

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
