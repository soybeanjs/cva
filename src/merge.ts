import { twMerge } from 'cn';
import { cn } from './cn';

export function merge(parts: readonly string[]): string {
  return parts.length === 0 ? '' : twMerge(cn(...parts));
}
