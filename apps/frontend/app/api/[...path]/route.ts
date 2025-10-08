import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  
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
    console.error('API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await props.params;
    const path = params.path.join('/');
    const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
    const body = await request.text();
    
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
    console.error('POST API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await props.params;
    const path = params.path.join('/');
    const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
    const body = await request.text();
    
    const res = await fetch(url, {
      method: 'PUT',
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
    console.error('PUT API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await props.params;
    const path = params.path.join('/');
    const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
    const body = await request.text();
    
    const res = await fetch(url, {
      method: 'PATCH',
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
    console.error('PATCH API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await props.params;
    const path = params.path.join('/');
    const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (res.status === 204) {
      return new Response(null, { 
        status: 204,
      });
    }
    
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('DELETE API Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
