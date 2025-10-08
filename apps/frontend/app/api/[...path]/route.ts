import { NextRequest } from 'next/server';

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
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  const body = await request.json();
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });
  
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(data, { 
    status: res.status,
  });
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  const body = await request.json();
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });
  
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(data, { 
    status: res.status,
  });
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  const body = await request.json();
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers),
    },
    body: JSON.stringify(body),
  });
  
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(data, { 
    status: res.status,
  });
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: request.headers as HeadersInit,
  });
  
  if (res.status === 204) {
    return new NextResponse(null, { 
      status: 204,
    });
  }
  
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(data, { 
    status: res.status,
  });
}
