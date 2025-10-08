import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.toString();
  const url = `${BACKEND_URL}/products${query ? `?${query}` : ''}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in products GET:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const url = `${BACKEND_URL}/products`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });
    
    const text = await res.text();
    
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in products POST:', error);
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
