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

interface PaymentFailedEmailProps {
  billingUrl: string;
  appName: string;
}

export function PaymentFailedEmail({
  billingUrl,
  appName,
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your recent payment could not be processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Payment failed</Text>
            <Text style={paragraph}>
              We were unable to process your most recent payment. This could
              be due to an expired card, insufficient funds, or a temporary
              issue with your bank.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                Your subscription will remain active for now, but if the
                payment issue is not resolved, your account may be
                downgraded to the Free plan and you will lose access to
                premium features.
              </Text>
            </Section>

            <Text style={paragraph}>
              Please update your payment method to avoid any service
              interruption:
            </Text>

            <Section style={ctaSection}>
              <Button style={button} href={billingUrl}>
                Update Payment Method
              </Button>
            </Section>

            <Text style={paragraph}>
              If you believe this is a mistake or need help, reply to this
              email and we will assist you.
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
  color: "#dc2626",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px",
};

const alertBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
  border: "1px solid #fecaca",
};

const alertText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#991b1b",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#dc2626",
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

export default PaymentFailedEmail;
