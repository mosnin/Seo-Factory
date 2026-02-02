import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          SEO Factory
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          AI-powered SEO content generation. Research keywords, generate
          optimized articles, and scale your organic traffic.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </a>
          <a href="/api/health">
            <Button variant="outline" size="lg">
              API Health Check
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}
