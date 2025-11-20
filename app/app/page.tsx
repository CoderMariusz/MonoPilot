export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">MonoPilot</h1>
        <p className="text-xl text-gray-600">Manufacturing Execution System</p>
        <div className="text-center text-sm text-gray-500">
          <p>Next.js 15 • React 19 • TypeScript 5.7 • Tailwind CSS 3.4</p>
          <p>Supabase • PostgreSQL</p>
        </div>
      </main>
    </div>
  )
}
