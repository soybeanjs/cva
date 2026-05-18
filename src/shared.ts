import type { NormalizedCompoundCondition } from './internal';

export function normalizeVariantSchema<VariantValue, Output>(
  variants: Readonly<Record<string, Readonly<Record<string, VariantValue>>>> | undefined,
  normalize: (value: VariantValue) => Output
): Readonly<Record<string, Readonly<Record<string, Output>>>> {
  return Object.fromEntries(
    Object.entries(variants ?? {}).map(([variantName, values]) => [
      variantName,
      Object.fromEntries(Object.entries(values).map(([variantValue, value]) => [variantValue, normalize(value)]))
    ])
  );
}

export function normalizeVariantValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return undefined;
}

export function normalizeDefaultVariants(
  defaultVariants: Record<string, unknown> | undefined
): Readonly<Record<string, string>> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(defaultVariants ?? {})) {
    const normalizedValue = normalizeVariantValue(value);

    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}

export function normalizeConditions<Entry extends Record<string, unknown>>(entry: Entry): NormalizedCompoundCondition {
  const conditions: Record<string, readonly string[]> = {};

  for (const [key, value] of Object.entries(entry)) {
    if (key === 'class' || key === 'className') {
      continue;
    }

    const normalizedValues = Array.isArray(value)
      ? value.map(item => normalizeVariantValue(item)).filter((item): item is string => item !== undefined)
      : [normalizeVariantValue(value)].filter((item): item is string => item !== undefined);

    if (normalizedValues.length > 0) {
      conditions[key] = normalizedValues;
    }
  }

  return conditions;
}

export function resolveSelections(
  props: Record<string, unknown> | undefined,
  defaultVariants: Readonly<Record<string, string>>
): Readonly<Record<string, string>> {
  const selections: Record<string, string> = { ...defaultVariants };

  if (!props) {
    return selections;
  }

  for (const [key, value] of Object.entries(props)) {
    const normalized = normalizeVariantValue(value);

    if (normalized !== undefined) {
      selections[key] = normalized;
    }
  }

  return selections;
}

export function matchesConditions(
  selections: Readonly<Record<string, string>>,
  conditions: NormalizedCompoundCondition
): boolean {
  for (const [key, expectedValues] of Object.entries(conditions)) {
    const actualValue = selections[key];

    if (!actualValue || !expectedValues.includes(actualValue)) {
      return false;
    }
  }

  return true;
}
