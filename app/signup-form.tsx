import Link from "next/link"
import { redirect } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

export function SignUpForm() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Try SaaStart for Free
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address to sign up and create a new organization for you and your collaborators.
        </p>
      </div>
      <form
        action={async (formData: FormData) => {
          "use server"

          const email = formData.get("email")
          if (!email || typeof email !== "string") return

          const searchParams = new URLSearchParams({
            login_hint: email,
          })

          redirect(`/onboarding/signup?${searchParams.toString()}`)
        }}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <SubmitButton>Get Started</SubmitButton>
        </div>
      </form>
      <p className="px-8 text-center text-sm text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
