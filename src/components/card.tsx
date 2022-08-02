import { clsx } from "clsx";
import React from "react";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx("rounded-lg bg-bg border border-border", className)}
      {...props}
    />
  );
});
