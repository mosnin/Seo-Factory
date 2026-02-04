import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-sm border bg-white",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        signInUrl="/auth/signin"
      />
    </div>
  );
}
