import Link from "next/link";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
            SF
          </div>
          <span className="text-xl font-bold">SEO Factory</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI-Powered SEO Content
            <span className="block text-brand-600">At Scale</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Generate high-quality, SEO-optimized articles in minutes. Research keywords,
            create fact-checked content, and scale your organic traffic with AI.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. 10 free credits to start.
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "SERP Research",
      description:
        "Automatically analyze top-ranking content for any keyword. Understand what works and why.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      ),
    },
    {
      title: "AI Content Generation",
      description:
        "Generate comprehensive, well-structured articles using Claude AI. Customizable length and style.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
      ),
    },
    {
      title: "Fact-Checking & Citations",
      description:
        "Every claim is verified with real sources. Automatic citation generation for credibility.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: "SEO Optimization",
      description:
        "Built-in SEO scoring with actionable recommendations. Optimize for keywords, readability, and E-E-A-T.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      title: "Brand Voice",
      description:
        "Create custom brand voices to maintain consistent tone and style across all your content.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      ),
    },
    {
      title: "Rich Text Editor",
      description:
        "Edit and refine your content with a powerful WYSIWYG editor. Export to HTML or Markdown.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need for SEO Content
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            From research to publication, SEO Factory handles the entire content creation workflow.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Credit-Based Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Pay only for what you use. No monthly commitments required.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Free Tier */}
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Free</h3>
            <p className="mt-2 text-gray-600">Perfect for trying out SEO Factory</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
            </p>
            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                10 free credits
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                All features included
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                No credit card required
              </li>
            </ul>
            <Link href="/auth/signup" className="mt-8 block">
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Starter */}
          <div className="rounded-xl border-2 border-brand-600 bg-white p-8 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-600">
                Popular
              </span>
            </div>
            <p className="mt-2 text-gray-600">For content creators and bloggers</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-600">/month</span>
            </p>
            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                100 credits/month
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                ~4 long-form articles
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Priority support
              </li>
            </ul>
            <Link href="/auth/signup" className="mt-8 block">
              <Button className="w-full">Subscribe</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
            <p className="mt-2 text-gray-600">For agencies and teams</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-600">/month</span>
            </p>
            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                500 credits/month
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                ~20 long-form articles
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                API access
              </li>
            </ul>
            <Link href="/auth/signup" className="mt-8 block">
              <Button variant="outline" className="w-full">
                Subscribe
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                SF
              </div>
              <span className="text-xl font-bold">SEO Factory</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              AI-powered SEO content generation for modern marketers and content teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Product</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/auth/signup" className="text-sm text-gray-600 hover:text-gray-900">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/api/health" className="text-sm text-gray-600 hover:text-gray-900">
                  API Status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Company</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-gray-600">About</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Blog</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Careers</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-gray-600">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} SEO Factory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
