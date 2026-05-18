import { joinClassParts, mergeTailwindClasses, toClassString } from './class-value';
import { attachRecipeMeta, getCVMeta } from './internal';
import type { CVRuntimeMeta, NormalizedCVCompoundVariant } from './internal';
import {
  matchesConditions,
  normalizeConditions,
  normalizeDefaultVariants,
  normalizeVariantSchema,
  resolveSelections
} from './shared';
import type { CVConfig, CVExtendEntry, CVResolvedProps, CVResult, CVVariantsSchema, RecipeClassValue } from './types';

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

type InferCVConfigVariants<Config> = Config extends { variants?: infer Variants }
  ? Variants extends CVVariantsSchema
    ? Variants
    : {}
  : {};

type InferCVConfigExtends<Config> = Config extends { extend?: infer Extends }
  ? Extends extends readonly CVExtendEntry[]
    ? Extends
    : readonly []
  : readonly [];

type ResolvedCVProps<Config> = CVResolvedProps<InferCVConfigVariants<Config>, InferCVConfigExtends<Config>>;

type ContextualCVConfig<Config> = CVConfig<InferCVConfigVariants<Config>, InferCVConfigExtends<Config>>;

export function cv<Config extends CVConfig<any, any>>(
  config: Config & ContextualCVConfig<Config>
): CVResult<InferCVConfigVariants<Config>, ResolvedCVProps<Config>> {
  type Variants = InferCVConfigVariants<Config>;
  const extendEntries = config.extend as readonly CVExtendEntry[] | undefined;
  const preparedExtends = normalizeExtends(extendEntries);
  const baseClassName = toClassString(config.base);

  const defaultVariants = mergeDefaultVariants(
    preparedExtends,
    config.defaultVariants as Record<string, unknown> | undefined
  );
  const normalizedVariants = normalizeVariantSchema(config.variants as Variants | undefined, classValue =>
    toClassString(classValue as RecipeClassValue | undefined)
  ) as Record<string, Record<string, string>>;
  const compoundVariants: readonly NormalizedCVCompoundVariant[] = (config.compoundVariants ?? []).map(variant => ({
    className: toClassString(variant.class ?? variant.className),
    conditions: normalizeConditions(variant as Record<string, unknown>)
  }));

  const meta: CVRuntimeMeta = {
    config: config as CVConfig<CVVariantsSchema, readonly CVExtendEntry[]>,
    defaultVariants,
    kind: 'cv',
    resolveRaw: (props?: Record<string, unknown>) => {
      const selections = resolveSelections(props, defaultVariants);
      const output: string[] = [];

      for (const source of preparedExtends) {
        output.push(...source.resolveRaw(selections));
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

  type ResolvedProps = ResolvedCVProps<Config>;

  const recipe: CVResult<Variants, ResolvedProps> = (props, ...merges) => {
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
