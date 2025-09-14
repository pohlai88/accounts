/**
 * Utility function for conditional class names
 *
 * Combines clsx and tailwind-merge for optimal class handling
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
