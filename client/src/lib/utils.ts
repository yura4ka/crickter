import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const emailRegexp = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
export const validatePassword = (password: string) => password.trim().length >= 4;
