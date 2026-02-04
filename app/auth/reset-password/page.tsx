import { SignIn } from "@clerk/nextjs";

// Clerk handles password reset through the sign-in flow
// When users click "Forgot password?" in the SignIn component,
// they are guided through the password reset process

export default function ResetPasswordPage() {
  return (
    <div className="flex justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-sm border bg-white",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/auth/signup"
      />
    </div>
  );
}
