import type { ClassValue } from './types';

function toVal(input: ClassValue): string {
  if (typeof input === 'string') {
    return input;
  }

  if (typeof input === 'number') {
    return String(input);
  }

  if (input === null || input === undefined || typeof input === 'boolean') {
    return '';
  }

  let result = '';

  if (Array.isArray(input)) {
    let i = 0;
    let tmpClassValue: ClassValue;
    let tmpClassName: string;
    for (; i < input.length; i++) {
      if ((tmpClassValue = input[i])) {
        if ((tmpClassName = toVal(tmpClassValue))) {
          if (result) result += ' ';
          result += tmpClassName;
        }
      }
    }

    return result;
  }

  for (const key in input) {
    if (input[key]) {
      if (result) result += ' ';
      result += key;
    }
  }

  return result;
}

export function cn(...args: ClassValue[]): string {
  let result = '';
  let i = 0;
  let tmpClassValue: ClassValue;
  let tmpClassName: string;

  for (; i < args.length; i++) {
    if ((tmpClassValue = args[i])) {
      if ((tmpClassName = toVal(tmpClassValue))) {
        if (result) result += ' ';
        result += tmpClassName;
      }
    }
  }

  return result;
}
