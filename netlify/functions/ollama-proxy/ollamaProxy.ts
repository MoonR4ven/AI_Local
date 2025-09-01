import type { Handler } from '@netlify/functions';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const NGROK_URL = process.env.NGROK_URL || 'https://8b1c1ca1a725.ngrok-free.app';

export const handler: Handler = async (event, context) => {
  try {
    // Determine which backend to use
    const useNgrok = process.env.USE_NGROK === 'true';
    const baseUrl = useNgrok ? NGROK_URL : OLLAMA_URL;
    
    // Extract the API path correctly
    const requestPath = event.path.replace('/.netlify/functions/ollama-proxy', '');
    const url = `${baseUrl}${requestPath}`;

    // Handle query parameters
    const queryString = event.queryStringParameters 
      ? `?${new URLSearchParams(event.queryStringParameters).toString()}`
      : '';

    const fullUrl = `${url}${queryString}`;

    console.log('Proxying to:', fullUrl);
    console.log('Method:', event.httpMethod);

    // Forward the request
    const response = await fetch(fullUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(event.headers.authorization && { 'Authorization': event.headers.authorization })
      },
      body: event.body,
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: `Ollama API error: ${response.status} ${response.statusText}` 
        }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error('Proxy error:', err);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Proxy error', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }),
    };
  }
};