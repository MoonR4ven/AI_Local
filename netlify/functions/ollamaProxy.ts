import type { Handler } from '@netlify/functions';

const NGROK_URL = process.env.VITE_OLLAMA_API_URL || 'https://8b1c1ca1a725.ngrok-free.app';

export const handler: Handler = async (event, context) => {
  try {
    // Determine which Ollama endpoint to call
    const path = event.path.replace('/.netlify/functions/ollamaProxy', '') || '/api/tags';
    const url = `${NGROK_URL}${path}`;

    // Forward the request method and body
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: event.body,
    });

    const data = await response.text(); // get text first
    let json;
    try {
      json = JSON.parse(data); // try to parse JSON
    } catch {
      json = { error: 'Failed to parse JSON', raw: data };
    }

    return {
      statusCode: response.status,
      body: JSON.stringify(json),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
