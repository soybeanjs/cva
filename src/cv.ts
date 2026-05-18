import { merge } from './merge';
import { cn } from './cn';
import { attachRecipeMeta, getCVMeta, getCurrentRecipeProps, withRecipePropsContext } from './internal';
import type { CVRuntimeMeta, NormalizedCVCompoundVariant } from './internal';
import {
  matchesConditions,
  normalizeConditions,
  normalizeDefaultVariants,
  normalizeRuntimeDefaultVariants,
  normalizeVariantSchema,
  resolveRuntimeProps,
  resolveSelections
} from './shared';
import type {
  CVConfig,
  CVExtendEntry,
  CVResolvedProps,
  AnyCVResult,
  CVResult,
  CVVariantsSchema,
  RecipeClassValue
} from './types';

function mergeDefaultVariants(
  preparedExtends: readonly CVRuntimeMeta[],
  localDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, string>> {
  const merged: Record<string, string> = {};

  for (const source of preparedExtends) {
    for (const [key, value] of Object.entries(source.defaultVariants)) {
      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(normalizeDefaultVariants(localDefaults))) {
    merged[key] = value;
  }

  return merged;
}

function mergeRuntimeDefaultVariants(
  preparedExtends: readonly CVRuntimeMeta[],
  localDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, unknown>> {
  const merged: Record<string, unknown> = {};

  for (const source of preparedExtends) {
    for (const [key, value] of Object.entries(source.runtimeDefaultVariants)) {
      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(normalizeRuntimeDefaultVariants(localDefaults))) {
    merged[key] = value;
  }

  return merged;
}

function normalizeExtends(extendEntries: readonly CVExtendEntry[] | undefined): readonly CVRuntimeMeta[] {
  const prepared: CVRuntimeMeta[] = [];

  for (const entry of extendEntries ?? []) {
    const meta = getCVMeta(entry);

    if (!meta) {
      throw new TypeError('cv.extend only accepts cv results.');
    }

    prepared.push(meta);
  }

  return prepared;
}

export function cv<
  Variants extends CVVariantsSchema | undefined = CVVariantsSchema | undefined,
  Extends extends readonly AnyCVResult[] = readonly []
>(config: CVConfig<Variants, Extends>) {
  const extendEntries = config.extend as readonly CVExtendEntry[] | undefined;
  const preparedExtends = normalizeExtends(extendEntries);
  const baseClassName = cn(config.base);
  const extendBase = config.extendBase as
    | ((props?: CVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>) => RecipeClassValue)
    | undefined;

  const defaultVariants = mergeDefaultVariants(
    preparedExtends,
    config.defaultVariants as Record<string, unknown> | undefined
  );
  const runtimeDefaultVariants = mergeRuntimeDefaultVariants(
    preparedExtends,
    config.defaultVariants as Record<string, unknown> | undefined
  );
  const normalizedVariants = normalizeVariantSchema(config.variants as Variants | undefined, classValue =>
    cn(classValue as RecipeClassValue | undefined)
  ) as Record<string, Record<string, string>>;
  const compoundVariants: readonly NormalizedCVCompoundVariant[] = (config.compoundVariants ?? []).map(variant => ({
    className: cn(variant.class ?? variant.className),
    conditions: normalizeConditions(variant as Record<string, unknown>)
  }));

  const meta: CVRuntimeMeta = {
    config: config as CVConfig<CVVariantsSchema, readonly CVExtendEntry[]>,
    defaultVariants,
    runtimeDefaultVariants,
    kind: 'cv',
    resolveRaw: (props?: Record<string, unknown>) => {
      const selections = resolveSelections(props, defaultVariants);
      const resolvedProps = resolveRuntimeProps(props, runtimeDefaultVariants, selections);
      const output: string[] = [];

      for (const source of preparedExtends) {
        output.push(...source.resolveRaw(resolvedProps));
      }

      const extendedBaseClassName = withRecipePropsContext(resolvedProps, () =>
        cn(extendBase?.(resolvedProps as CVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>))
      );

      if (extendedBaseClassName) {
        output.push(extendedBaseClassName);
      }

      if (baseClassName) {
        output.push(baseClassName);
      }

      for (const [variantName, values] of Object.entries(normalizedVariants)) {
        const selectedValue = selections[variantName];

        if (!selectedValue) {
          continue;
        }

        const className = values[selectedValue];

        if (className) {
          output.push(className);
        }
      }

      for (const compoundVariant of compoundVariants) {
        if (matchesConditions(selections, compoundVariant.conditions) && compoundVariant.className) {
          output.push(compoundVariant.className);
        }
      }

      return output;
    }
  };

  type ResolvedProps = CVResolvedProps<Variants, Extends>;

  const recipe: CVResult<Variants, ResolvedProps> = (props, ...merges) => {
    const resolvedProps = (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps();
    const output = meta.resolveRaw(resolvedProps);

    if (merges.length === 0) {
      return cn(output);
    }

    const mergedParts = [...output];

    for (const mergeValue of merges) {
      const mergeClassName = cn(mergeValue);

      if (mergeClassName) {
        mergedParts.push(mergeClassName);
      }
    }

    return merge(mergedParts);
  };

  return attachRecipeMeta(recipe, meta) as CVResult<
    NoInfer<Variants>,
    CVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>
  >;
}

export type { CVConfig, CVProps, CVResult } from './types';
