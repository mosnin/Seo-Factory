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

interface MonthlySummaryEmailProps {
  name: string | null;
  articlesGenerated: number;
  creditsUsed: number;
  topKeywords: string[];
  month: string;
  dashboardUrl: string;
  appName: string;
}

export function MonthlySummaryEmail({
  name,
  articlesGenerated,
  creditsUsed,
  topKeywords,
  month,
  dashboardUrl,
  appName,
}: MonthlySummaryEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>Your {month} content report is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Your {month} Report</Text>
            <Text style={paragraph}>{greeting}</Text>
            <Text style={paragraph}>
              Here is a summary of your content generation activity for{" "}
              {month}.
            </Text>

            {/* Metrics */}
            <Section style={metricsRow}>
              <Section style={metricCard}>
                <Text style={metricValue}>{articlesGenerated}</Text>
                <Text style={metricLabel}>Articles Generated</Text>
              </Section>
              <Section style={metricCard}>
                <Text style={metricValue}>{creditsUsed}</Text>
                <Text style={metricLabel}>Credits Used</Text>
              </Section>
            </Section>

            {/* Top Keywords */}
            {topKeywords.length > 0 && (
              <>
                <Text style={subheading}>Top Keywords</Text>
                <Section style={keywordBox}>
                  {topKeywords.map((kw, i) => (
                    <Text key={i} style={keywordItem}>
                      {i + 1}. {kw}
                    </Text>
                  ))}
                </Section>
              </>
            )}

            <Section style={ctaSection}>
              <Button style={button} href={dashboardUrl}>
                View Dashboard
              </Button>
            </Section>

            <Text style={paragraph}>
              Keep generating content consistently to improve your organic
              traffic. Need more credits? Visit the billing page to top up.
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

const subheading = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#18181b",
  margin: "0 0 8px",
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
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  verticalAlign: "top" as const,
  border: "1px solid #e5e7eb",
  marginRight: "8px",
};

const metricValue = {
  fontSize: "32px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0",
};

const metricLabel = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "4px 0 0",
};

const keywordBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 24px",
  border: "1px solid #e5e7eb",
};

const keywordItem = {
  fontSize: "14px",
  color: "#374151",
  margin: "0 0 4px",
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

export default MonthlySummaryEmail;
