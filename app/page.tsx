export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          SEO Factory
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          AI-powered SEO content generation. Research keywords, generate
          optimized articles, and scale your organic traffic.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="/dashboard"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
          >
            Go to Dashboard
          </a>
          <a
            href="/api/health"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            API Health Check
          </a>
        </div>
      </div>
    </main>
  );
}
