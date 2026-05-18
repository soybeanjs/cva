import { twMerge } from 'tailwind-merge';
import { cn } from './cn';

export function merge(parts: readonly string[]): string {
  return parts.length === 0 ? '' : twMerge(cn(...parts));
}
