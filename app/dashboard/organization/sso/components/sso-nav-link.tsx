"use client"

import Link from "next/link"
import { useParams, useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"

export default function SsoNavLink({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const { connectionId } = useParams<{ connectionId: string }>()
  const segment = useSelectedLayoutSegment()
  const isActive = slug === segment

  return (
    <Link
      href={`/dashboard/organization/sso/oidc/edit/${connectionId}/${slug}`}
      className={cn(
        isActive
          ? "font-semibold text-primary underline underline-offset-[12px]"
          : "font-normal text-muted-foreground transition-colors hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}
