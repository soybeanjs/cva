import type { CompiledConditionEntry } from './internal';

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

export function normalizeRuntimeDefaultVariants(
  defaultVariants: Record<string, unknown> | undefined
): Readonly<Record<string, unknown>> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(defaultVariants ?? {})) {
    const normalizedValue = normalizeVariantValue(value);

    if (normalizedValue !== undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
}

export function collectSelectionKeyNames(
  variantNames: readonly string[],
  conditions: readonly (readonly CompiledConditionEntry[])[],
  defaultVariants: Readonly<Record<string, string>>
): readonly string[] {
  const names = [...variantNames];
  const seen = new Set<string>(names);

  for (const conditionEntries of conditions) {
    for (const [key] of conditionEntries) {
      if (!seen.has(key)) {
        seen.add(key);
        names.push(key);
      }
    }
  }

  for (const key of Object.keys(defaultVariants)) {
    if (!seen.has(key)) {
      seen.add(key);
      names.push(key);
    }
  }

  return names;
}

/**
 * Build a cache key that uniquely identifies the resolved selection vector
 * (`defaults` overridden by normalized `props`), without materializing the
 * selections object. Unset names contribute an empty segment; an unset name
 * and an empty-string value collide, but both resolve identically (falsy
 * selections never match variants or compound conditions).
 */
export function buildSelectionKey(
  props: Record<string, unknown> | undefined,
  keyNames: readonly string[],
  defaultVariants: Readonly<Record<string, string>>
): string {
  let key = '';

  for (let i = 0; i < keyNames.length; i++) {
    const name = keyNames[i];
    let value = props === undefined ? undefined : normalizeVariantValue(props[name]);

    if (value === undefined) {
      value = defaultVariants[name];
    }

    if (value !== undefined) {
      key += value;
    }

    key += '\u0000';
  }

  return key;
}

export const RESOLVE_CACHE_LIMIT = 512;

export function setBounded<Key, Value>(cache: Map<Key, Value>, key: Key, value: Value): void {
  cache.set(key, value);

  if (cache.size > RESOLVE_CACHE_LIMIT) {
    const oldest = cache.keys().next();

    if (!oldest.done) {
      cache.delete(oldest.value);
    }
  }
}

export function normalizeConditions<Entry extends Record<string, unknown>>(
  entry: Entry
): readonly CompiledConditionEntry[] {
  const conditions: CompiledConditionEntry[] = [];

  for (const [key, value] of Object.entries(entry)) {
    if (key === 'class' || key === 'className') {
      continue;
    }

    const normalizedValues = Array.isArray(value)
      ? value.map(item => normalizeVariantValue(item)).filter((item): item is string => item !== undefined)
      : [normalizeVariantValue(value)].filter((item): item is string => item !== undefined);

    if (normalizedValues.length > 0) {
      conditions.push([key, normalizedValues]);
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

export function resolveRuntimeProps(
  props: Record<string, unknown> | undefined,
  defaultVariants: Readonly<Record<string, unknown>>,
  selections: Readonly<Record<string, string>>
): Readonly<Record<string, unknown>> {
  const resolvedProps: Record<string, unknown> = { ...defaultVariants };

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value !== undefined && value !== null) {
      resolvedProps[key] = value;
    }
  }

  for (const [key, value] of Object.entries(selections)) {
    if (!(key in resolvedProps)) {
      resolvedProps[key] = value;
    }
  }

  return resolvedProps;
}

export function matchesConditions(
  selections: Readonly<Record<string, string>>,
  conditions: readonly CompiledConditionEntry[]
): boolean {
  for (const [key, expectedValues] of conditions) {
    const actualValue = selections[key];

    if (!actualValue || !expectedValues.includes(actualValue)) {
      return false;
    }
  }

  return true;
}
