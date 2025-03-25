"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "@radix-ui/react-icons"
import { CircleUserRoundIcon, MousePointerClickIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"

import { getTicketUrl } from "./actions"

export default function AddConnectionForm() {
  const popupRef = useRef<Window | null>(null)
  const ref = useRef<HTMLFormElement>(null)

  const openPopup = async (formData: FormData) => {
    if (popupRef.current && !popupRef.current.closed) return // Prevent opening multiple popups

    const url = await getTicketUrl(
      formData.get("name")?.valueOf() as string,
      formData.get("assign_membership_on_login")?.valueOf() as boolean,
      formData.get("show_as_button")?.valueOf() as boolean,
      formData.get("button_display_name")?.valueOf() as string | null
    ) // Fetch the external URL

    if (typeof url !== "string") throw new Error(url.error)

    // Get current window dimensions
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Set popup to 75% of current window
    const popupWidth = Math.floor(screenWidth * 0.75)
    const popupHeight = Math.floor(screenHeight * 0.75)

    // Calculate centered position
    const left = Math.floor((screenWidth - popupWidth) / 2 + window.screenX)
    const top = Math.floor((screenHeight - popupHeight) / 2 + window.screenY)

    popupRef.current = window.open(
      url,
      "_blank",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    )

    if (popupRef.current) {
      const interval = setInterval(() => {
        if (!popupRef.current || popupRef.current.closed) {
          clearInterval(interval)
          popupRef.current = null
          onPopupClose() // Trigger callback when closed
        }
      }, 500)
    }
  }

  const router = useRouter()

  const onPopupClose = () => {
    toast.success(`Connection Created`)
    ref.current?.reset()
    router.refresh() // Re-fetch server components and reload page data
  }

  return (
    <Card>
      <form ref={ref} action={(formData: FormData) => openPopup(formData)}>
        <CardHeader>
          {" "}
          <CardTitle>Add Your SSO Provider</CardTitle>
          <CardDescription>
            Add your Identity Provider for your employees to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid space-y-2">
            <div className="flex space-x-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name">Identity Provider Name</Label>
                <Input type="text" id="name" name="name" placeholder="my-idp" />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="button_display_name">Button Display Name</Label>
                <Input
                  type="text"
                  id="button_display_name"
                  name="button_display_name"
                  placeholder="Login with My IdP"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between space-x-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Label className="flex items-center space-x-4" htmlFor="otp">
                  <div className="rounded-md border bg-secondary p-3">
                    <MousePointerClickIcon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div>Show as Button</div>
                    <div className="text-muted-foreground">
                      Display a button only to users of this org to choose this
                      IdP for signin
                    </div>
                  </div>
                </Label>

                <Checkbox
                  defaultChecked={false}
                  value="true"
                  id="show_as_button"
                  className="peer"
                  name="show_as_button"
                />
              </div>
              <div className="flex justify-between space-x-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                <Label className="flex items-center space-x-4" htmlFor="otp">
                  <div className="rounded-md border bg-secondary p-3">
                    <CircleUserRoundIcon className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div>Assign Membership on Login</div>
                    <div className="text-muted-foreground">
                      Anyone who can sign into this IdP should be a member of
                      this organization.
                    </div>
                  </div>
                </Label>

                <Checkbox
                  defaultChecked={false}
                  value="true"
                  id="assign_membership_on_login"
                  className="peer"
                  name="assign_membership_on_login"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton>
            <PlusIcon className="mr-1 size-4" />
            Add Connection
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
