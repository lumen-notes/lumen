import { clsx } from "clsx";
import React from "react";

export type ButtonProps = {
  variant?: "default" | "primary";
} & React.ComponentPropsWithoutRef<"button">;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "rounded px-3 py-2 font-semibold leading-[16px] disabled:pointer-events-none disabled:opacity-50 ring-1 ring-inset ring-border bg-bg",
          variant === "primary" && "text-bg bg-text ring-0",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
