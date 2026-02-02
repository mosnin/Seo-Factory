import { Client } from "pg";

interface CognitoTriggerEvent {
  version: string;
  triggerSource: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: Record<string, string>;
  };
  response: Record<string, unknown>;
}

/**
 * Post-confirmation Lambda trigger for Cognito.
 * Creates a user record in the database when a new user confirms their email.
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string
 *
 * Required IAM permissions:
 *   - VPC access (if DB is in a VPC): ec2:CreateNetworkInterface, etc.
 *
 * Deploy: zip this with node_modules (pg) and upload to AWS Lambda.
 * Runtime: Node.js 20.x
 */
export async function handler(event: CognitoTriggerEvent): Promise<CognitoTriggerEvent> {
  // Only run for confirmed sign-ups, not forgotten-password confirmations
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
    return event;
  }

  const { sub, email, name } = event.request.userAttributes;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    await client.connect();

    // Generate a cuid-like ID. In production, consider importing @paralleldrive/cuid2.
    const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

    await client.query(
      `INSERT INTO users (id, "cognitoSub", email, name, "planTier", "creditsBalance", "onboardingCompleted", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'FREE', 5, false, NOW(), NOW())
       ON CONFLICT ("cognitoSub") DO NOTHING`,
      [id, sub, email, name || null]
    );

    console.log(`Created user record for ${email} (sub: ${sub})`);
  } catch (error) {
    console.error("Failed to create user record:", error);
    // Don't throw -- we don't want to block the sign-up flow.
    // The user record can be created lazily on first dashboard access.
  } finally {
    await client.end();
  }

  return event;
}
