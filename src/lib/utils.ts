import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EMBEDCAT_LOGO_URL = "https://cdn.discordapp.com/avatars/1480407438258733056/d23de1c2d1f8e397c333c6b600bd27aa.webp?size=1024"
