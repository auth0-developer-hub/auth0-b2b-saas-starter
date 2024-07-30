"use client"

import { EnvelopeClosedIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SubmitButton } from "@/components/submit-button"

import { resendVerificationEmail } from "./actions"

export default function Verify() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="grid gap-2">
          <EnvelopeClosedIcon className="size-5" />
          <span>Verify your e-mail</span>
        </CardTitle>
        <CardDescription>
          Please check your inbox for a verification link to continue creating
          your account.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <form
          action={async () => {
            const { error } = await resendVerificationEmail()

            if (error) {
              toast.error(error)
              return
            }

            toast.success(
              "The verification e-mail has successfully been sent. Please check your inbox."
            )
          }}
        >
          <SubmitButton>Resend Verification</SubmitButton>
        </form>
      </CardFooter>
    </Card>
  )
}
