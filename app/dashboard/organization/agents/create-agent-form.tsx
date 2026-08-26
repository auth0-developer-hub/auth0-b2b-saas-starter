"use client"

import { useRef } from "react"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

import { createAgent } from "./actions"

export function CreateAgentForm() {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <Card>
      <form
        ref={ref}
        action={async (formData: FormData) => {
          const { error } = await createAgent(formData)

          if (error) {
            toast.error(error)
          } else {
            toast.success(`Registered agent: ${formData.get("name")}`)
            ref.current?.reset()
          }
        }}
      >
        <CardHeader>
          <CardTitle>Register an agent</CardTitle>
          <CardDescription>
            Registering an agent creates an identity for it and nothing more. It
            grants no access — that is assigned separately, per resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="grid w-full content-start items-center gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                maxLength={255}
                placeholder="Compliance Reviewer"
                required
              />
            </div>
            <div className="grid w-full content-start items-center gap-1.5">
              <Label htmlFor="external_agent_id">
                External agent ID{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>

              <Input
                type="text"
                id="external_agent_id"
                name="external_agent_id"
                maxLength={255}
                placeholder="compliance-reviewer-prod"
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Your own identifier for this agent. It replaces the generated ID
                as the token subject.
              </p>
            </div>
          </div>
          <Alert>
            <InfoCircledIcon className="size-4" />
            <AlertTitle>Both fields are recorded in tenant logs</AlertTitle>
            <AlertDescription>
              Auth0 writes the name and external agent ID to the tenant logs,
              which may be forwarded to log streaming destinations. Do not put
              personally identifiable information in either one.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Register</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
