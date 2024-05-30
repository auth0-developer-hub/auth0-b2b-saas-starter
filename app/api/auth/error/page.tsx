"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SearchBar() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="mx-auto max-w-sm">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/" className="w-full">
            <Button className="w-full">
              Go to Homepage <ArrowRightIcon className="ml-2 size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
