"use client"

import { useRef } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SubmitButton } from "@/components/submit-button"

import { createInvitation } from "./actions"

export function CreateInvitationForm() {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <Card>
      <form
        ref={ref}
        action={async (formData: FormData) => {
          const { error } = await createInvitation(formData)

          if (error) {
            toast.error(error)
          } else {
            toast.success(`Invitation sent to ${formData.get("email")}`)
            ref.current?.reset()
          }
        }}
      >
        <CardHeader>
          <CardTitle>Invite team members</CardTitle>
          <CardDescription>
            Invite team members to join this organization using their email
            address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="jane@example.com"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="member" name="role">
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Send</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
