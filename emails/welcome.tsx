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

interface WelcomeEmailProps {
  name: string | null;
  appUrl: string;
  appName: string;
}

export function WelcomeEmail({ name, appUrl, appName }: WelcomeEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>
        Your 10 free credits are ready — start generating SEO content
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Welcome to {appName}!</Text>
            <Text style={paragraph}>{greeting}</Text>
            <Text style={paragraph}>
              Thanks for signing up. You have{" "}
              <strong>10 free credits</strong> waiting for you. Each credit
              generates a fully optimized, fact-checked article tailored to
              your brand voice.
            </Text>

            <Text style={subheading}>Quick Start Guide</Text>

            <Section style={stepsBox}>
              <Text style={stepItem}>
                <strong>1. Choose a keyword</strong> — Pick a topic you want
                to rank for.
              </Text>
              <Text style={stepItem}>
                <strong>2. Set your brand voice</strong> — Define your tone,
                style, and point of view.
              </Text>
              <Text style={stepItem}>
                <strong>3. Generate</strong> — We handle research, writing,
                fact-checking, and SEO optimization.
              </Text>
              <Text style={stepItem}>
                <strong>4. Review &amp; publish</strong> — Edit in our
                Grammarly-style editor, then export or publish.
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={button} href={`${appUrl}/dashboard/articles/new`}>
                Generate Your First Article
              </Button>
            </Section>

            <Text style={paragraph}>
              Need help? Reply to this email or check out our docs. We are
              here to help you create content that ranks.
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
  margin: "24px 0 12px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px",
};

const stepsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
  border: "1px solid #e5e7eb",
};

const stepItem = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 8px",
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

export default WelcomeEmail;
