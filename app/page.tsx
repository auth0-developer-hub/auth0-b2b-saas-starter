import Link from "next/link"

import { appClient } from "@/lib/auth0"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Auth0Logo } from "@/components/auth0-logo"

import { SignUpForm } from "./signup-form"
import { WelcomeBackCard } from "./welcome-back-card"
import { SubmitButton } from "@/components/submit-button"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Home() {
  let session;
  let error;

  try {
    const session = await appClient.getSession()
  } catch (e) {
    error = e instanceof Error ? e : new Error('An unexpected error occurred')
  }


  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle className="text-center text-xl mb-4">Configuration Issue</CardTitle>
            <CardDescription>Verify that all setup steps have been followed correctly as outlined in the <a className="text-ring underline"
              href="https://github.com/auth0-developer-hub/auth0-b2b-saas-starter?tab=readme-ov-file#step-three-bootstrap-the-auth0-tenant">README documentation</a>.</CardDescription>
          </CardHeader>
          <CardFooter>

          </CardFooter>
        </Card>
      </div>
    )
  }


  return (
    <div className="container relative sm:grid h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {session ? (
        <a
          href="/api/auth/logout"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8"
          )}
        >
          <SubmitButton>Logout</SubmitButton>
        </a>
      ) : (
        <div
          className="absolute right-4 top-4 md:right-8 md:top-8"
        ><span className="text-sm">Already joined?</span> <a
          className="text-sm underline"
          href="/api/auth/login"
        >
            <SubmitButton>Log in</SubmitButton>
          </a>
        </div>
      )}

      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-black" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Auth0Logo className="mr-2 size-8" />
          <span className="font-semibold">SaaStart</span>
        </div>
        <div className="relative z-20 m-auto max-w-sm text-center">
          <blockquote className="space-y-2">
            <div className="space-y-8">
              <p className="text-lg font-medium">
                SaaStart is a reference B2B SaaS application built using Next.js
                and Auth0 by Okta.
              </p>
              <p className="text-lg">
                It features multi-tenancy support, user management and access
                controls, security policies, self-service Single Sign-On
                configuration and more out-of-the-box.
              </p>
            </div>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 flex h-screen">
        {session ? <WelcomeBackCard /> : <SignUpForm />}
      </div>
    </div>
  )
}
