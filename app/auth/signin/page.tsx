import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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
