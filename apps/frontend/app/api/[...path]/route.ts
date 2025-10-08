import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

function forwardHeaders(backendResponse: Response): Headers {
  const headers = new Headers();
  backendResponse.headers.forEach((value, key) => {
    headers.append(key, value);
  });
  return headers;
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const path = params.path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  
  const res = await fetch(url, {
    headers: request.headers as HeadersInit,
  });
  
  const contentType = res.headers.get('content-type');
  
  if (res.status === 204 || !contentType?.includes('application/json')) {
    return new NextResponse(res.body, { 
      status: res.status,
      headers: forwardHeaders(res)
    });
  }
  
  const data = await res.json();
  return NextResponse.json(data, { 
    status: res.status,
    headers: forwardHeaders(res)
  });
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
    headers: forwardHeaders(res)
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
    headers: forwardHeaders(res)
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
      headers: forwardHeaders(res)
    });
  }
  
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : await res.text();
  return NextResponse.json(data, { 
    status: res.status,
    headers: forwardHeaders(res)
  });
}
