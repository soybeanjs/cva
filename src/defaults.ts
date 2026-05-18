import { attachRecipeMeta, getCVMeta, getSCVMeta, getCurrentRecipeProps } from './internal';
import type { CVRuntimeMeta, SCVRuntimeMeta } from './internal';
import { normalizeDefaultVariants, normalizeRuntimeDefaultVariants } from './shared';
import type { ClassValue, CVResult, CVVariantsSchema, SCVResult, VariantSchemaBase } from './types';

function mergeProps(
  baseProps: Readonly<Record<string, unknown>>,
  props: Record<string, unknown> | undefined
): Record<string, unknown> {
  const mergedProps: Record<string, unknown> = { ...baseProps };

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value !== undefined && value !== null) {
      mergedProps[key] = value;
    }
  }

  return mergedProps;
}

function mergeDefaultVariants(
  currentDefaults: Readonly<Record<string, string>>,
  nextDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, string>> {
  return {
    ...currentDefaults,
    ...normalizeDefaultVariants(nextDefaults)
  };
}

function mergeRuntimeDefaultVariants(
  currentDefaults: Readonly<Record<string, unknown>>,
  nextDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, unknown>> {
  return {
    ...currentDefaults,
    ...normalizeRuntimeDefaultVariants(nextDefaults)
  };
}

function wrapCVDefaults<Variants extends CVVariantsSchema, Props extends Record<string, unknown>>(
  recipe: CVResult<Variants, Props>,
  meta: CVRuntimeMeta,
  defaultVariants: Partial<Props>
): CVResult<Variants, Props> {
  const nextDefaults = mergeDefaultVariants(meta.defaultVariants, defaultVariants);
  const nextRuntimeDefaults = mergeRuntimeDefaultVariants(meta.runtimeDefaultVariants, defaultVariants);
  const wrappedMeta: CVRuntimeMeta = {
    ...meta,
    config: {
      ...meta.config,
      defaultVariants: nextRuntimeDefaults
    },
    defaultVariants: nextDefaults,
    runtimeDefaultVariants: nextRuntimeDefaults,
    resolveRaw: (props?: Record<string, unknown>) => meta.resolveRaw(mergeProps(nextRuntimeDefaults, props))
  };
  const wrappedRecipe: CVResult<Variants, Props> = (props?: Props, ...merges: ClassValue[]) =>
    recipe(
      mergeProps(
        nextRuntimeDefaults,
        (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps()
      ) as Props,
      ...merges
    );

  return attachRecipeMeta(wrappedRecipe, wrappedMeta);
}

function wrapSCVDefaults<
  SlotKeys extends string,
  Variants extends VariantSchemaBase,
  Props extends Record<string, unknown>
>(
  recipe: SCVResult<SlotKeys, Variants, Props>,
  meta: SCVRuntimeMeta,
  defaultVariants: Partial<Props>
): SCVResult<SlotKeys, Variants, Props> {
  const nextDefaults = mergeDefaultVariants(meta.defaultVariants, defaultVariants);
  const nextRuntimeDefaults = mergeRuntimeDefaultVariants(meta.runtimeDefaultVariants, defaultVariants);
  const wrappedMeta: SCVRuntimeMeta = {
    ...meta,
    config: {
      ...meta.config,
      defaultVariants: nextRuntimeDefaults
    },
    defaultVariants: nextDefaults,
    runtimeDefaultVariants: nextRuntimeDefaults,
    resolveRaw: (props?: Record<string, unknown>) => meta.resolveRaw(mergeProps(nextRuntimeDefaults, props))
  };
  const wrappedRecipe: SCVResult<SlotKeys, Variants, Props> = (
    props?: Props,
    ...merges: (Partial<Record<SlotKeys, ClassValue>> | undefined)[]
  ) =>
    recipe(
      mergeProps(
        nextRuntimeDefaults,
        (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps()
      ) as Props,
      ...merges
    );

  return attachRecipeMeta(wrappedRecipe, wrappedMeta);
}

export function defaults<Variants extends CVVariantsSchema, Props extends Record<string, unknown>>(
  recipe: CVResult<Variants, Props>,
  defaultVariants: Partial<Props>
): CVResult<Variants, Props>;
export function defaults<
  SlotKeys extends string,
  Variants extends VariantSchemaBase,
  Props extends Record<string, unknown>
>(recipe: SCVResult<SlotKeys, Variants, Props>, defaultVariants: Partial<Props>): SCVResult<SlotKeys, Variants, Props>;
export function defaults(
  recipe: CVResult<any, any> | SCVResult<any, any, any>,
  defaultVariants: Record<string, unknown>
): CVResult<any, any> | SCVResult<any, any, any> {
  const cvMeta = getCVMeta(recipe);

  if (cvMeta) {
    return wrapCVDefaults(recipe as CVResult<any, Record<string, unknown>>, cvMeta, defaultVariants);
  }

  const scvMeta = getSCVMeta(recipe);

  if (scvMeta) {
    return wrapSCVDefaults(recipe as SCVResult<any, any, Record<string, unknown>>, scvMeta, defaultVariants);
  }

  throw new TypeError('defaults only accepts cv or scv results.');
}
