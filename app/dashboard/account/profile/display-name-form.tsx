"use client"

import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

import { updateDisplayName } from "./actions"

interface Props {
  displayName: string
}

export function DisplayNameForm({ displayName }: Props) {
  return (
    <Card>
      <form
        action={async (formData: FormData) => {
          const { error } = await updateDisplayName(formData)

          if (error) {
            toast.error(error)
          } else {
            toast.success("Your display name has been updated.")
          }
        }}
      >
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Enter a name you would liked to have displayed to other users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="display_name" className="sr-only">
              Display Name
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="John Smith"
              defaultValue={displayName}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Save</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
