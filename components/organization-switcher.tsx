"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface AccountSwitcherProps extends PopoverTriggerProps {
  organizations: {
    id: string
    slug: string
    displayName: string
    logoUrl?: string
  }[]
  currentOrgId: string
}

export function OrganizationSwitcher({
  organizations,
  currentOrgId,
}: AccountSwitcherProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const organization = organizations.find((org) => org.id === currentOrgId)!

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className="w-[200px] justify-between"
        >
          <Avatar className="mr-2 size-5 rounded-sm">
            <AvatarImage
              src={organization.logoUrl}
              alt={organization.displayName}
            />
            <AvatarFallback className="rounded-sm">
              {organization.displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{organization.displayName}</span>
          <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organizations..." />
            <CommandEmpty>No organization found.</CommandEmpty>

            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    router.push(
                      `/api/auth/login?organization=${org.id}&returnTo=/dashboard`
                    )
                    setOpen(false)
                  }}
                  className="text-sm"
                >
                  <Avatar className="mr-2 size-5 rounded-sm">
                    <AvatarImage src={org.logoUrl} alt={org.displayName} />
                    <AvatarFallback className="rounded-sm">
                      {org.displayName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.displayName}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      organization.slug === org.slug
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  router.push("/onboarding/create")
                  setOpen(false)
                }}
              >
                <PlusCircledIcon className="mr-2 size-4" />
                Create Account
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
