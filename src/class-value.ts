import { twMerge } from 'tailwind-merge';
import type { ClassValue } from './types';

function collectClassString(value: ClassValue): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    let result = '';

    for (const item of value) {
      const normalized = collectClassString(item);

      if (!normalized) {
        continue;
      }

      result = result ? `${result} ${normalized}` : normalized;
    }

    return result;
  }

  let result = '';

  for (const [className, enabled] of Object.entries(value)) {
    if (!enabled) {
      continue;
    }

    const normalized = className.trim();

    if (!normalized) {
      continue;
    }

    result = result ? `${result} ${normalized}` : normalized;
  }

  return result;
}

export function toClassString(value: ClassValue | undefined): string {
  return value === undefined ? '' : collectClassString(value);
}

export function toClassParts(value: ClassValue | undefined): string[] {
  const normalized = toClassString(value);

  return normalized ? [normalized] : [];
}

export function joinClassParts(parts: readonly string[]): string {
  if (parts.length === 0) {
    return '';
  }

  return parts.join(' ');
}

export function mergeTailwindClasses(parts: readonly string[]): string {
  return parts.length === 0 ? '' : twMerge(joinClassParts(parts));
}
