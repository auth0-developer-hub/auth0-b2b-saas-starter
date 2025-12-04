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

import { createApiClient, CreateApiClientSuccess } from "./actions"

export function CreateApiClientForm() {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <Card>
      <form
        ref={ref}
        action={async (formData: FormData) => {
          toast.promise(createApiClient(formData), {
            loading: "Creating client...",
            success: (result) => {
              if ("error" in result) {
                throw result.error
              }

              toast(() => <h5>Your client secret is:</h5>, {
                description: () => (
                  <code>
                    {
                      (result as unknown as CreateApiClientSuccess)
                        ?.clientSecret
                    }
                  </code>
                ),
                duration: Infinity,
                action: {
                  label: "Dismiss",
                  onClick: () => {},
                },
              })
              return `API Client created: ${formData.get("name")}`
            },
            error: (err) => err,
          })
        }}
      >
        <CardHeader>
          <CardTitle>Create API Client</CardTitle>
          <CardDescription>
            Create a new API client for your application to access this
            organization&apos;s resources.
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
                  <SelectItem value="non_interactive">
                    Non Interactive
                  </SelectItem>
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
