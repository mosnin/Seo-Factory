import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
