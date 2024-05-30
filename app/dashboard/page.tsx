import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className="flex flex-1 flex-grow flex-col gap-4 lg:gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="flex flex-col items-center gap-1 text-center max-w-[500px]">
          <h3 className="text-2xl font-bold tracking-tight">
            Explore the Starter
          </h3>
          <p className="mt-1 text-muted-foreground">The content that you will see depends on your role in the Organization that you’ve logged in with.</p>
          <div className="mt-4">
            <Link href="/dashboard/organization/general" className="w-full">
              <Button className="w-full">
                Go to Organization Settings <ArrowRightIcon className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
