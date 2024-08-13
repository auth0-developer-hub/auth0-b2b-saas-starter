"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SubmitButton } from "@/components/submit-button"

import { deleteAccount } from "./actions"

export function DeleteAccountForm() {
  const router = useRouter()

  return (
    <Card>
      <form
        action={async () => {
          const { error } = await deleteAccount()

          if (error) {
            toast.error(error)
          } else {
            toast.success(
              "Your account has been deleted and you will be logged out."
            )

            router.push("/api/auth/logout")
          }
        }}
      >
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Permanently remove all profile data across all organizations you
            belong to.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <p className="text-sm">
            <span className="font-bold">Warning:</span> This action is immediate
            and cannot be undone.
          </p>
          <SubmitButton variant="destructive">Delete Account</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
