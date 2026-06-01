import React from "react"
import { cn } from "../../utils/cn"

export function AnimatedCard({ className, ...props }) {
  return (
    <div
      role="region"
      aria-labelledby="card-title"
      aria-describedby="card-description"
      className={cn(
        "group/animated-card relative w-full h-full min-h-[300px] overflow-hidden rounded-3xl border border-white/5 bg-black/40 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }) {
  return (
    <div
      role="group"
      className={cn(
        "flex flex-col space-y-1.5 border-t border-white/5 p-6 bg-black/60 backdrop-blur-md absolute bottom-0 left-0 right-0",
        className
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-base font-bold tracking-tight text-white",
        className
      )}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "text-xs text-white/50",
        className
      )}
      {...props}
    />
  )
}

export function CardVisual({ className, ...props }) {
  return (
    <div
      className={cn("h-full w-full overflow-hidden absolute inset-0 -bottom-24", className)}
      {...props}
    />
  )
}
