import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanTitle(title: string): string {
  if (!title) return "";
  
  // Decode HTML entities (like &lt; to <, &gt; to >, etc.)
  let decoded = title;
  try {
    for (let i = 0; i < 2; i++) {
      const nextDecoded = decoded
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'");
      if (nextDecoded === decoded) break;
      decoded = nextDecoded;
    }
  } catch (e) {
    // Fallback if replace fails
  }

  // Strip HTML tags like <b>, <i>, etc.
  return decoded.replace(/<\/?[^>]+(>|$)/g, "");
}
