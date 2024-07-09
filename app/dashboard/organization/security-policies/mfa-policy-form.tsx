"use client"

import { KeyIcon, KeySquareIcon } from "lucide-react"
import { toast } from "sonner"

import { MfaPolicy } from "@/lib/mfa-policy"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { SubmitButton } from "@/components/submit-button"

import { updateMfaPolicy } from "./actions"

interface Props {
  organization: {
    id: string
    displayName: string
    slug: string
    mfaPolicy: MfaPolicy
  }
}

export function MfaPolicyForm({ organization }: Props) {
  return (
    <Card>
      <form
        action={async (formData: FormData) => {
          const { error } = await updateMfaPolicy(formData)

          if (error) {
            toast.error(error)
          } else {
            toast.success("The organization's MFA policy has been updated.")
          }
        }}
      >
        <CardHeader>
          <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
          <CardDescription>
            Configure the MFA policies for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-row items-center justify-between rounded-lg border bg-field p-3 shadow-sm">
            <div className="space-y-1.5">
              <Label>Enforce Multi-Factor Authentication</Label>
              <div className="text-sm text-muted-foreground">
                Users will be required to verify their identity with a second
                factor.
              </div>
            </div>
            <Switch
              name="enforce"
              defaultChecked={organization.mfaPolicy.enforce}
            />
          </div>

          <Separator />

          <div className="grid w-full gap-1.5">
            <Label htmlFor="skip_for_domains">
              Do not enforce MFA for the following e-mail domains
            </Label>
            <Textarea
              defaultValue={organization.mfaPolicy.skipForDomains.join(", ")}
              placeholder="example.com, auth0.com"
              name="skip_for_domains"
              id="skip_for_domains"
            />
            <p className="text-sm text-muted-foreground">
              Enter a comma-separated list of e-mail domains.
            </p>
          </div>

          <Separator />

          <div className="grid gap-4">
            <Label>
              Select which MFA providers your users are allowed to use
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between space-x-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Label className="flex items-center space-x-4" htmlFor="otp">
                  <div className="rounded-md border bg-secondary p-3">
                    <KeyIcon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div>One-time Password</div>
                    <div className="text-muted-foreground">
                      OTP using Google Authenticator or similar.
                    </div>
                  </div>
                </Label>

                <Checkbox
                  defaultChecked={organization.mfaPolicy.providers.includes(
                    "otp"
                  )}
                  value="otp"
                  id="otp"
                  className="peer"
                  name="otp"
                />
              </div>

              <div className="flex justify-between space-x-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Label
                  className="flex items-center space-x-4"
                  htmlFor="webauthn-roaming"
                >
                  <div className="rounded-md border bg-secondary p-3">
                    <KeySquareIcon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div>Security Keys</div>
                    <div className="text-muted-foreground">
                      WebAuthn-compliant security keys (like FIDO2).
                    </div>
                  </div>
                </Label>

                <Checkbox
                  defaultChecked={organization.mfaPolicy.providers.includes(
                    "webauthn-roaming"
                  )}
                  value="webauthn-roaming"
                  id="webauthn-roaming"
                  className="peer"
                  name="webauthn-roaming"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Save</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
