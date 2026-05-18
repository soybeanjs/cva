import { joinClassParts, mergeTailwindClasses, toClassParts, toClassString } from './class-value';
import { getCVMeta, getSCVMeta, attachRecipeMeta, getCurrentRecipeProps, withRecipePropsContext } from './internal';
import type {
  NormalizedSCVCompoundVariant,
  NormalizedSlotClassParts,
  PreparedExtend,
  RawSlotsResult,
  SCVRuntimeMeta,
  SlotBlueprint
} from './internal';
import {
  matchesConditions,
  normalizeConditions,
  normalizeDefaultVariants,
  normalizeRuntimeDefaultVariants,
  normalizeVariantSchema,
  resolveRuntimeProps,
  resolveSelections
} from './shared';
import { createEmptyRawSlots, mergeConfig, mergeInheritedRaw, pushClassParts } from './merge-config';
import type {
  ClassValue,
  RecipeClassValue,
  SCVConfig,
  AnySCVResult,
  SCVResolvedProps,
  SCVResult,
  SCVVariantsSchema,
  SlotClassMap,
  SCVOutputSlotKeys
} from './types';

function createSlotClassParts(map: Partial<Record<string, RecipeClassValue>> | undefined): NormalizedSlotClassParts {
  const slots: Record<string, readonly string[]> = {};

  for (const [slotName, classValue] of Object.entries(map ?? {})) {
    const className = toClassString(classValue);

    if (!className) {
      continue;
    }

    slots[slotName] = [className];
  }

  return { slots };
}

function applySlotClassParts(
  target: RawSlotsResult,
  classParts: NormalizedSlotClassParts,
  layer: 'inherited' | 'local'
): void {
  const slotTarget = layer === 'inherited' ? target.inheritedShared : target.localShared;

  for (const [slotName, parts] of Object.entries(classParts.slots)) {
    if (slotName in target.slotPlan) {
      pushClassParts(slotTarget, slotName, parts);
    }
  }
}

function mergeDefaultVariants(
  preparedExtends: readonly PreparedExtend[],
  localDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, string>> {
  const merged: Record<string, string> = {};

  for (const source of preparedExtends) {
    const sourceDefaults = source.meta.defaultVariants;

    for (const [key, value] of Object.entries(sourceDefaults)) {
      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(normalizeDefaultVariants(localDefaults))) {
    merged[key] = value;
  }

  return merged;
}

function mergeRuntimeDefaultVariants(
  preparedExtends: readonly PreparedExtend[],
  localDefaults: Record<string, unknown> | undefined
): Readonly<Record<string, unknown>> {
  const merged: Record<string, unknown> = {};

  for (const source of preparedExtends) {
    const sourceDefaults = source.meta.runtimeDefaultVariants;

    for (const [key, value] of Object.entries(sourceDefaults)) {
      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(normalizeRuntimeDefaultVariants(localDefaults))) {
    merged[key] = value;
  }

  return merged;
}

function normalizeExtends(extendEntries: readonly AnySCVResult[] | undefined): readonly PreparedExtend[] {
  const prepared: PreparedExtend[] = [];

  for (const entry of extendEntries ?? []) {
    const scvMeta = getSCVMeta(entry);

    if (scvMeta) {
      prepared.push({ kind: 'scv', meta: scvMeta });
      continue;
    }

    if (getCVMeta(entry)) {
      throw new TypeError(
        'scv.extend does not accept cv results directly. Map them to a slot key, for example { root: recipe }.'
      );
    }

    for (const [slotName, candidate] of Object.entries(entry)) {
      const mappedMeta = getCVMeta(candidate);

      if (mappedMeta) {
        prepared.push({ kind: 'cv', meta: mappedMeta, slot: slotName });
      }
    }
  }

  return prepared;
}

function collectMappedSlots(extendEntries: readonly AnySCVResult[] | undefined): string[] {
  const mappedSlots: string[] = [];

  for (const entry of extendEntries ?? []) {
    if (getSCVMeta(entry)) {
      continue;
    }

    if (getCVMeta(entry)) {
      throw new TypeError(
        'scv.extend does not accept cv results directly. Map them to a slot key, for example { root: recipe }.'
      );
    }

    for (const slotName of Object.keys(entry)) {
      if (!mappedSlots.includes(slotName)) {
        mappedSlots.push(slotName);
      }
    }
  }

  return mappedSlots;
}

function buildMergeParts<SlotKeys extends string>(
  merges: readonly (Partial<Record<SlotKeys, ClassValue>> | undefined)[] | undefined,
  slotPlan: Readonly<Record<string, SlotBlueprint>>
): Readonly<Record<string, string[]>> {
  const output: Record<string, string[]> = {};
  if (!merges) {
    return output;
  }

  for (const mergeEntry of merges) {
    if (!mergeEntry) {
      continue;
    }

    for (const [slotName, value] of Object.entries(mergeEntry as Record<string, ClassValue | undefined>)) {
      if (!(slotName in slotPlan)) {
        continue;
      }

      const current = output[slotName] ?? [];

      current.push(...toClassParts(value));

      output[slotName] = current;
    }
  }

  return output;
}

function collectLocalSlotNames<SlotKeys extends string>(slotClasses: SlotClassMap<SlotKeys> | undefined): string[] {
  return Object.keys(slotClasses ?? {});
}

export function scv<
  SlotKeys extends string,
  Extends extends readonly AnySCVResult[] = readonly [],
  Variants extends SCVVariantsSchema<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>> | undefined =
    | SCVVariantsSchema<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>>
    | undefined
>(config: SCVConfig<SlotKeys, Extends, Variants>) {
  const extendEntries = config.extend;
  const localSlotNames = collectLocalSlotNames(config.slots as SlotClassMap<SlotKeys> | undefined);
  const extendBase = config.extendBase as
    | ((
        props?: SCVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>
      ) => SlotClassMap<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>>)
    | undefined;

  const mappedSlots = collectMappedSlots(extendEntries);
  const preparedExtends = normalizeExtends(extendEntries);
  const { slotOrder, slotPlan } = mergeConfig(localSlotNames, preparedExtends, mappedSlots);
  const extendIgnore = new Set<string>(config.extendIgnore ?? []);
  const localSlots = createSlotClassParts(config.slots);
  const localVariants = normalizeVariantSchema(config.variants as Variants | undefined, slotMap =>
    createSlotClassParts(slotMap as Partial<Record<string, RecipeClassValue>> | undefined)
  ) as Record<string, Record<string, NormalizedSlotClassParts>>;
  const localCompoundVariants: readonly NormalizedSCVCompoundVariant[] = (config.compoundVariants ?? []).map(
    variant => ({
      classParts: createSlotClassParts(variant.class ?? variant.className),
      conditions: normalizeConditions(variant as Record<string, unknown>)
    })
  );
  const resolvedExtends = normalizeExtends(extendEntries);
  const defaultVariants = mergeDefaultVariants(resolvedExtends, config.defaultVariants);
  const runtimeDefaultVariants = mergeRuntimeDefaultVariants(resolvedExtends, config.defaultVariants);

  const meta: SCVRuntimeMeta = {
    // @ts-expect-error ignore config type
    config,
    defaultVariants,
    runtimeDefaultVariants,
    kind: 'scv',
    preparedExtends: resolvedExtends,
    resolveRaw: (props?: Record<string, unknown>) => {
      const output = createEmptyRawSlots(slotOrder, slotPlan);
      const selections = resolveSelections(props, defaultVariants);
      const resolvedProps = resolveRuntimeProps(props, runtimeDefaultVariants, selections);

      for (const source of resolvedExtends) {
        if (source.kind === 'scv') {
          mergeInheritedRaw(output, source.meta.resolveRaw(resolvedProps));
          continue;
        }

        const parts = source.meta.resolveRaw(resolvedProps);
        pushClassParts(output.inheritedShared, source.slot, parts);
      }

      const extendedBaseSlots = withRecipePropsContext(resolvedProps, () =>
        createSlotClassParts(extendBase?.(resolvedProps as SCVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>))
      );

      applySlotClassParts(output, extendedBaseSlots, 'local');

      applySlotClassParts(output, localSlots, 'local');

      for (const [variantName, values] of Object.entries(localVariants)) {
        const selectedValue = selections[variantName];

        if (!selectedValue) {
          continue;
        }

        const classParts = values[selectedValue];

        if (classParts) {
          applySlotClassParts(output, classParts, 'local');
        }
      }

      for (const compoundVariant of localCompoundVariants) {
        if (matchesConditions(selections, compoundVariant.conditions)) {
          applySlotClassParts(output, compoundVariant.classParts, 'local');
        }
      }

      for (const slotName of slotOrder) {
        const inheritedParts = extendIgnore.has(slotName) ? [] : [...(output.inheritedShared[slotName] ?? [])];
        const localParts = [...(output.localShared[slotName] ?? [])];
        output.localUnique[slotName] = [...inheritedParts, ...localParts];

        if (extendIgnore.has(slotName)) {
          delete output.inheritedShared[slotName];
          delete output.inheritedUnique[slotName];
        }
      }

      return output;
    },
    slotOrder,
    slotPlan
  };

  type ResolvedProps = SCVResolvedProps<Variants, Extends>;

  const recipe: SCVResult<SlotKeys, Variants, ResolvedProps> = (props?: ResolvedProps, ...merges) => {
    const resolvedProps = (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps();
    const raw = meta.resolveRaw(resolvedProps);
    const mergeParts = merges.length === 0 ? undefined : buildMergeParts(merges, raw.slotPlan);
    const outputEntries = raw.slotOrder.map(slotName => {
      const baseParts = raw.localUnique[slotName] ?? [];
      const slotParts = mergeParts ? [...baseParts, ...(mergeParts[slotName] ?? [])] : baseParts;

      return [slotName, mergeParts ? mergeTailwindClasses(slotParts) : joinClassParts(slotParts)];
    });

    return Object.fromEntries(outputEntries) as Record<SCVOutputSlotKeys<SlotKeys, Extends>, string>;
  };

  return attachRecipeMeta(recipe, meta) as SCVResult<
    SCVOutputSlotKeys<SlotKeys, Extends>,
    NoInfer<Variants>,
    SCVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>
  >;
}

export type { SCVConfig, SCVProps, SCVResult } from './types';
