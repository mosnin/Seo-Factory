import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

interface ArticleReadyEmailProps {
  keyword: string;
  articleUrl: string;
  seoScore: number | null;
  wordCount: number | null;
  appName: string;
}

export function ArticleReadyEmail({
  keyword,
  articleUrl,
  seoScore,
  wordCount,
  appName,
}: ArticleReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your article &quot;{keyword}&quot; is ready to review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Your article is ready!</Text>
            <Text style={paragraph}>
              Your article for <strong>&quot;{keyword}&quot;</strong> has
              been generated, fact-checked, and optimized. Here are the
              highlights:
            </Text>

            {/* Metrics */}
            <Section style={metricsRow}>
              {seoScore !== null && (
                <Section style={metricCard}>
                  <Text style={metricValue}>{seoScore.toFixed(1)}</Text>
                  <Text style={metricLabel}>SEO Score</Text>
                </Section>
              )}
              {wordCount !== null && (
                <Section style={metricCard}>
                  <Text style={metricValue}>
                    {wordCount.toLocaleString()}
                  </Text>
                  <Text style={metricLabel}>Words</Text>
                </Section>
              )}
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={articleUrl}>
                View &amp; Edit Article
              </Button>
            </Section>

            <Text style={paragraph}>
              Open the article in our editor to review suggestions, check
              the outline, and publish when you are satisfied with the
              result.
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            {appName} — AI-powered SEO content generation
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "560px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const header = {
  backgroundColor: "#18181b",
  borderRadius: "8px 8px 0 0",
  padding: "24px 32px",
};

const logo = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700" as const,
  margin: "0",
};

const content = {
  padding: "32px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px",
};

const metricsRow = {
  margin: "0 0 24px",
};

const metricCard = {
  display: "inline-block" as const,
  width: "45%",
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  verticalAlign: "top" as const,
  border: "1px solid #bbf7d0",
  marginRight: "8px",
};

const metricValue = {
  fontSize: "28px",
  fontWeight: "700" as const,
  color: "#166534",
  margin: "0",
};

const metricLabel = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "4px 0 0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block" as const,
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  padding: "16px 32px",
};

export default ArticleReadyEmail;
