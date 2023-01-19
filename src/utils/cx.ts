import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Class name utility that combines `clsx` and `tailwind-merge` */
export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
