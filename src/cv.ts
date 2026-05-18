import { joinClassParts, mergeTailwindClasses, toClassString } from './class-value';
import { attachRecipeMeta } from './internal';
import type { CVRuntimeMeta, NormalizedCVCompoundVariant } from './internal';
import {
  matchesConditions,
  normalizeConditions,
  normalizeDefaultVariants,
  normalizeVariantSchema,
  resolveSelections
} from './shared';
import type { CVConfig, CVProps, CVResult, CVVariantsSchema } from './types';

export function cv<Variants extends CVVariantsSchema>(config: CVConfig<Variants>): CVResult<Variants> {
  const baseClassName = toClassString(config.base);

  const defaultVariants = normalizeDefaultVariants(config.defaultVariants as Record<string, unknown> | undefined);
  const normalizedVariants = normalizeVariantSchema(config.variants, classValue => toClassString(classValue)) as Record<
    string,
    Record<string, string>
  >;
  const compoundVariants: readonly NormalizedCVCompoundVariant[] = (config.compoundVariants ?? []).map(variant => ({
    className: toClassString(variant.class ?? variant.className),
    conditions: normalizeConditions(variant as Record<string, unknown>)
  }));

  const meta: CVRuntimeMeta = {
    config: config as CVConfig<CVVariantsSchema>,
    defaultVariants,
    kind: 'cv',
    resolveRaw: (props?: Record<string, unknown>) => {
      const selections = resolveSelections(props, defaultVariants);
      const output = baseClassName ? [baseClassName] : [];

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

  const recipe: CVResult<Variants> = (props?: CVProps<Variants>, ...merges) => {
    const output = meta.resolveRaw(props as Record<string, unknown> | undefined);

    if (merges.length === 0) {
      return joinClassParts(output);
    }

    const mergedParts = [...output];

    for (const mergeValue of merges) {
      const mergeClassName = toClassString(mergeValue);

      if (mergeClassName) {
        mergedParts.push(mergeClassName);
      }
    }

    return mergeTailwindClasses(mergedParts);
  };

  return attachRecipeMeta(recipe, meta);
}

export type { CVConfig, CVProps, CVResult } from './types';
