import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }
  // Handle ISO string
  const isoMatch = dateString.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    const [year, month, day] = isoMatch[0].split("-");
    return `${day}-${month}-${year}`;
  }
  // Handle DD-MM-YYYY HH:mm:ss.SSS
  const customMatch = dateString.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (customMatch) {
    const [, day, month, year] = customMatch;
    return `${day}-${month}-${year}`;
  }
  return "N/A";
}
