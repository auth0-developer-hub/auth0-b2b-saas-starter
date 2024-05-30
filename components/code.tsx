import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLSpanElement>

export function Code({ className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        "rounded-md bg-secondary px-1 py-0.5 font-mono text-xs text-secondary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
