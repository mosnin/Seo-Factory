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

interface LowCreditsEmailProps {
  currentBalance: number;
  billingUrl: string;
  appName: string;
}

export function LowCreditsEmail({
  currentBalance,
  billingUrl,
  appName,
}: LowCreditsEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`You have ${currentBalance} credits remaining`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>You&apos;re running low on credits</Text>
            <Text style={paragraph}>
              You currently have{" "}
              <strong>
                {currentBalance} credit{currentBalance !== 1 ? "s" : ""}
              </strong>{" "}
              remaining. To keep generating high-quality SEO content without
              interruption, consider topping up your balance.
            </Text>

            <Section style={balanceBox}>
              <Text style={balanceValue}>{currentBalance}</Text>
              <Text style={balanceLabel}>Credits Remaining</Text>
            </Section>

            <Text style={paragraph}>
              Upgrade your plan for monthly credits, or purchase a one-time
              credit pack to keep going.
            </Text>

            <Section style={ctaSection}>
              <Button style={button} href={billingUrl}>
                Buy More Credits
              </Button>
            </Section>
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

const balanceBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "0 0 24px",
  border: "1px solid #fde68a",
};

const balanceValue = {
  fontSize: "36px",
  fontWeight: "700" as const,
  color: "#92400e",
  margin: "0",
};

const balanceLabel = {
  fontSize: "13px",
  color: "#92400e",
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

export default LowCreditsEmail;
