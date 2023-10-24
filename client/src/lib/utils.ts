import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const emailRegexp = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
export const validatePassword = (password: string) => password.trim().length >= 4;
export const nameMaxLength = 64;
export const usernameMaxLength = 64;
export const emailMaxLength = 256;

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const DIVISIONS = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
] as const;

export function formatTimeAgo(date: Date) {
  let duration = (Number(date) - Number(new Date())) / 1000;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}

interface Operations {
  size: string;
  format: "jpeg" | "png" | "webp" | "auto" | "preserve";
  quality: "normal" | "smart" | "better" | "best" | "lighter" | "lightest";
}

export function optimizeImageUrl(
  url: string,
  type: string,
  { size = "40x40", format = "auto", quality = "lightest" }: Partial<Operations> = {}
): string {
  if (type === "gif") return url;
  return (
    url +
    `-/format/${format}/-/progressive/yes/-/quality/${quality}/-/scale_crop/${size}/smart/`
  );
}
