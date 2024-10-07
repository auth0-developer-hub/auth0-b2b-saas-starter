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

import { createApiClient } from "./actions"

export function CreateApiClientForm() {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <Card>
      <form
        ref={ref}
        action={async (formData: FormData) => {
          const result = await createApiClient(formData)

          if ('error' in result) {
            toast.error(result.error)
          } else {
            toast.success(`API Client created: ${formData.get("name")}`)
            toast.info(`Client ID: ${result.clientId}`)
            toast.info(`Client Secret: ${result.clientSecret}`)
            ref.current?.reset()
          }
        }}
      >
        <CardHeader>
          <CardTitle>Create API Client</CardTitle>
          <CardDescription>
            Create a new API client for your application to access this organization's resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Client Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder="My Application"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="app_type">Application Type</Label>
              <Select defaultValue="regular_web" name="app_type">
                <SelectTrigger id="app_type">
                  <SelectValue placeholder="Select an application type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="spa">Single Page App</SelectItem>
                  <SelectItem value="regular_web">Regular Web App</SelectItem>
                  <SelectItem value="non_interactive">Non Interactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Create Client</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}