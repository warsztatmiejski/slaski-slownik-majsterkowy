import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'large'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', variant = 'default', ...props }, ref) => {
    const baseClasses =
	  'flex w-full rounded-xs border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    const variantClasses =
	  variant === 'large'
		? 'h-14 px-3 py-3 text-lg font-semibold'
		: 'h-10 text-sm'
    return (
      <input
        type={type}
        className={cn(baseClasses, variantClasses, className)}
        ref={ref}
        {...props}
      />
	)
  }
)
Input.displayName = "Input"

export { Input }
