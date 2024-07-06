"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SubmitButton } from "@/components/submit-button"

import { createEnrollment, deleteEnrollment } from "./actions"

type MfaEnrollment = {
  name: string
  enabled: boolean
  enrollmentId?: string
}

interface IPopupWindow {
  width: number
  height: number
  title: string
  url: string
  focus: boolean
  scrollbars: boolean
}

const factorsMeta: {
  [key: string]: any
} = {
  sms: {
    title: "Phone Message",
    description: "Users will receive a phone message with a verification code",
  },
  "push-notification": {
    title: "Push Notification using Auth0 Guardian",
    description: "Provide a push notification using Auth0 Guardian.",
  },
  otp: {
    title: "One-time Password",
    description:
      "Provide a one-time password using Google Authenticator or similar.",
  },
  email: {
    title: "Email",
    description:
      "Users will receive an email message containing a verification code.",
  },
  duo: {
    title: "Duo Security",
    description: "Use your DUO account for Multi-factor Authentication.",
  },
  "webauthn-roaming": {
    title: "WebAuthn with FIDO Security Keys",
    description:
      "Depending on your browser, you can use WebAuthn-compliant security keys (like FIDO2) as a second factor of authentication.",
  },
  "webauthn-platform": {
    title: "WebAuthn with FIDO Device Biometrics",
    description:
      "Depending on your browser, you can use WebAuthn-compliant device biometrics as a second factor of authentication",
  },
  "recovery-code": {
    title: "Recovery Code",
    description:
      "Provide a unique code that allows users to regain access to their account.",
  },
}

function openPopupWindow(popupOptions: IPopupWindow): Window | null {
  {
    const dualScreenLeft =
      window.screenLeft !== undefined ? window.screenLeft : window.screenX
    const dualScreenTop =
      window.screenTop !== undefined ? window.screenTop : window.screenY

    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height

    const systemZoom = width / window.screen.availWidth
    const left = (width - popupOptions.width) / 2 / systemZoom + dualScreenLeft
    const top = (height - popupOptions.height) / 2 / systemZoom + dualScreenTop
    const newWindow = window.open(
      popupOptions.url,
      popupOptions.title,
      `scrollbars=${popupOptions.scrollbars ? "yes" : "no"},
      width=${popupOptions.width / systemZoom},
      height=${popupOptions.height / systemZoom},
      top=${top},
      left=${left}
      `
    )
    newWindow!.opener = null
    if (popupOptions.focus) {
      newWindow!.focus()
    }
    return newWindow
  }
}

type MFAEnrollmentProps = {
  factors: MfaEnrollment[]
}

export function MFAEnrollmentForm({ factors }: MFAEnrollmentProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Manage the MFA enrollments for your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 p-4 pt-0 md:p-6 md:pt-0">
        {factors
          .filter((factor: any) => factor.enabled)
          .map((factor: any, idx: number) => {
            const meta = factorsMeta[factor.name]

            return (
              <div className="flex flex-col gap-6" key={`${meta.name}-${idx}`}>
                {idx > 0 && <Separator />}
                <div
                  key={factor.name}
                  className="flex flex-col items-center justify-between space-y-6 md:flex-row md:space-x-2 md:space-y-0"
                >
                  <Label className="flex flex-col space-y-1">
                    <span className="leading-6">
                      {meta.title}
                      {factor.enrollmentId && (
                        <Badge variant="default" className="ml-3">
                          Enrolled
                        </Badge>
                      )}
                    </span>
                    <p className="max-w-fit font-normal leading-snug text-muted-foreground">
                      {meta.description}
                    </p>
                  </Label>

                  <div className="flex items-center justify-end space-x-24 md:min-w-72">
                    {factor.enrollmentId ? (
                      <form
                        action={async (formData: FormData) => {
                          const { error } = await deleteEnrollment(formData)

                          if (error) {
                            toast.error(error)
                            return
                          }

                          toast.success("Enrollment removed successfully.")
                        }}
                      >
                        <input
                          type="hidden"
                          name="enrollment_id"
                          value={factor.enrollmentId}
                        />
                        <SubmitButton
                          className="h-fit min-w-24"
                          variant="outline"
                        >
                          Remove
                        </SubmitButton>
                      </form>
                    ) : (
                      <form
                        action={async (formData: FormData) => {
                          const { error, ticketUrl } =
                            await createEnrollment(formData)

                          if (error) {
                            toast.error(error)
                            return
                          }

                          const enrollmentPopupWindow = openPopupWindow({
                            url: ticketUrl!,
                            title: "SaaStart MFA Enrollment",
                            width: 450,
                            height: 720,
                            scrollbars: true,
                            focus: true,
                          })

                          const timer = setInterval(async () => {
                            if (
                              enrollmentPopupWindow &&
                              enrollmentPopupWindow.closed
                            ) {
                              clearInterval(timer)
                              router.refresh()
                            }
                          }, 200)
                        }}
                      >
                        <input
                          type="hidden"
                          name="factor_name"
                          value={factor.name}
                        />
                        <SubmitButton
                          className="h-fit min-w-24"
                          variant="default"
                        >
                          Enroll
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
