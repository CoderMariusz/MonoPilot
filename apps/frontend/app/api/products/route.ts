import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.toString();
  const url = `${BACKEND_URL}/products${query ? `?${query}` : ''}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in products route:', error);
    const errorText = JSON.stringify({ error: 'Failed to fetch' });
    const encoder = new TextEncoder();
    const errorData = encoder.encode(errorText);
    
    return new Response(errorData, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': errorData.length.toString(),
      },
    });
  }
}
