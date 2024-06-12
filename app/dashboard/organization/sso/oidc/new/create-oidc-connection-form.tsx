"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CopyIcon, InfoCircledIcon, TrashIcon } from "@radix-ui/react-icons"
import slugify from "@sindresorhus/slugify"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Code } from "@/components/code"
import { SubmitButton } from "@/components/submit-button"

import { AddDomainDialog } from "../../components/add-domain-dialog"
import { createConnection } from "./actions"

const CALLBACK_URL = `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/login/callback`

interface Props {
  domainVerificationToken: string
}

export function CreateOidcConnectionForm({ domainVerificationToken }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState("front_channel")
  const [domains, setDomains] = useState<string[]>([])

  return (
    <Card>
      <form
        action={async (formData: FormData) => {
          const { error } = await createConnection(formData)

          if (error) {
            toast.error(error)
          } else {
            toast.success("The connection has been created.")
            router.push("/dashboard/organization/sso")
          }
        }}
      >
        <CardHeader>
          <CardTitle>Create an OIDC Connection</CardTitle>
          <CardDescription>
            Configure a new OpenID Connect connection for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="display_name">Connection Name</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="Acme OIDC"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Identifier: <Code>{slugify(name || "Acme OIDC")}</Code>
            </p>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="discovery_url">Discovery URL</Label>
            <Input
              id="discovery_url"
              name="discovery_url"
              type="url"
              placeholder="https://auth.example.com/.well-known/openid-configuration"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="type">Type</Label>
            <RadioGroup
              id="type"
              name="type"
              defaultValue="front_channel"
              className="grid grid-cols-2 gap-2"
              value={type}
              onValueChange={setType}
            >
              <div>
                <RadioGroupItem
                  value="front_channel"
                  id="front_channel"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="front_channel"
                  className="flex h-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="space-y-1.5">
                    <div>Front Channel</div>
                    <div className="leading-normal text-muted-foreground">
                      Uses <Code>response_mode=form_post</Code> and{" "}
                      <Code>response_type=id_token</Code>.
                    </div>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="back_channel"
                  id="back_channel"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="back_channel"
                  className="flex h-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="space-y-1.5">
                    <div>Back Channel</div>
                    <div className="leading-normal text-muted-foreground">
                      Uses <Code>response_type=code</Code>.
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              name="client_id"
              type="text"
              placeholder="client_iPK9vGmAkQKgXTweA8"
            />
          </div>

          {type === "back_channel" && (
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="client_secret">Client Secret</Label>
              <Input
                id="client_secret"
                name="client_secret"
                type="password"
                placeholder="··················"
              />
            </div>
          )}

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="scope">Scopes</Label>
            <Input
              id="scope"
              name="scope"
              type="text"
              defaultValue="openid profile email"
              placeholder="openid profile email"
            />
            <p className="text-sm text-muted-foreground">
              A space-separated list of scopes. Must contain <Code>openid</Code>
              .
            </p>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="domains">Domains</Label>
            <Input
              id="domains"
              name="domains"
              type="text"
              className="hidden"
              value={domains.join(",")}
              readOnly
            />
            {domains.length > 0 ? (
              domains.map((domain) => (
                <div key={domain} className="flex space-x-2">
                  <Input className="font-mono" value={domain} readOnly />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setDomains(domains.filter((d) => d !== domain))
                      }}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                <p>No domains have been added yet.</p>
              </div>
            )}
            <div>
              <AddDomainDialog
                domains={domains}
                setDomains={setDomains}
                domainVerificationToken={domainVerificationToken}
              />
            </div>
          </div>

          <Alert>
            <InfoCircledIcon className="size-4" />
            <AlertTitle>Callback URL</AlertTitle>
            <AlertDescription>
              You may need to configure the OIDC issuer with the following
              callback URL:
              <div className="mt-2 flex space-x-2">
                <Input className="font-mono" value={CALLBACK_URL} readOnly />
                <Button size="icon" variant="outline" type="button">
                  <CopyIcon
                    className="size-4"
                    onClick={async () => {
                      await navigator.clipboard.writeText(CALLBACK_URL)
                      toast.success("Callback URL copied to clipboard.")
                    }}
                  />
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="assign_membership_on_login">Auto-Membership</Label>
            <RadioGroup
              id="assign_membership_on_login"
              name="assign_membership_on_login"
              defaultValue="enabled"
              className="grid grid-cols-2 gap-2"
            >
              <div>
                <RadioGroupItem
                  value="enabled"
                  id="enable_auto_membership"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="enable_auto_membership"
                  className="flex h-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="space-y-1.5">
                    <div>Enable Auto-Membership</div>
                    <div className="leading-normal text-muted-foreground">
                      All users logging in with this connection will be
                      automatically added as members of this organization.
                    </div>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="disabled"
                  id="disable_auto_membership"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="disable_auto_membership"
                  className="flex h-full rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="space-y-1.5">
                    <div>Disable Auto-Membership</div>
                    <div className="leading-normal text-muted-foreground">
                      All users logging in with this connection will not be
                      added as members to this organization.
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton>Create Connection</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
