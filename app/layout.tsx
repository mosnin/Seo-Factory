import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

// Force dynamic rendering for all pages since this is an authenticated app
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SEO Factory - AI-Powered SEO Content Generation",
  description:
    "Generate high-quality, SEO-optimized articles with AI. Research keywords, create content, and track rankings all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
