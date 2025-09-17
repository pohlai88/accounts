/**
 * Utility function for conditional class names
 *
 * Combines clsx and tailwind-merge for optimal class handling
 */
// @ts-nocheck


import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
