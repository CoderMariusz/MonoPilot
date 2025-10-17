export async function GET() {
  return new Response(JSON.stringify({ 
    ok: true, 
    time: new Date().toISOString(),
    env: process.env.NEXT_PUBLIC_APP_ENV || 'development'
  }), {
    headers: { 
      "content-type": "application/json" 
    },
    status: 200,
  });
}

