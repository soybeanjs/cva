import { joinClassParts, mergeTailwindClasses, toClassParts, toClassString } from './class-value';
import { getCVMeta, getSCVMeta, attachRecipeMeta } from './internal';
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
  normalizeVariantSchema,
  resolveSelections
} from './shared';
import { createEmptyRawSlots, mergeConfig, mergeInheritedRaw, pushClassParts } from './merge-config';
import type {
  ClassValue,
  RecipeClassValue,
  SCVConfig,
  SCVExtendEntry,
  SCVExtendRecord,
  SCVOutputSlotKeysLoose,
  SCVResolvedProps,
  SCVResult,
  SCVVariantsSchema,
  SlotClassMap,
  VariantSchemaBase
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

function normalizeExtends(
  extendEntries: readonly (SCVResult<string, VariantSchemaBase> | SCVExtendRecord<string>)[] | undefined
): readonly PreparedExtend[] {
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

function collectMappedSlots(
  extendEntries: readonly (SCVResult<string, VariantSchemaBase> | SCVExtendRecord<string>)[] | undefined
): string[] {
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

type InferSCVVariantSlotKeys<Config> = Config extends { variants?: infer Variants }
  ? Variants extends Record<string, Record<string, infer SlotMap>>
    ? keyof SlotMap & string
    : never
  : never;

type InferSCVConfigSlotKeys<Config> =
  | (Config extends { slots?: infer Slots } ? keyof NonNullable<Slots> & string : never)
  | InferSCVVariantSlotKeys<Config>
  | (Config extends { extendIgnore?: readonly (infer Keys)[] } ? Keys & string : never);

type InferSCVConfigVariants<Config> = Config extends { variants?: infer Variants }
  ? Variants extends SCVVariantsSchema<InferSCVConfigSlotKeys<Config>>
    ? Variants
    : {}
  : {};

type InferSCVConfigExtends<Config> = Config extends { extend?: infer Extends }
  ? Extends extends readonly SCVExtendEntry[]
    ? Extends
    : readonly []
  : readonly [];

type ResolvedSCVSlotKeys<Config> = SCVOutputSlotKeysLoose<
  InferSCVConfigSlotKeys<Config>,
  InferSCVConfigExtends<Config>
>;

type ResolvedSCVProps<Config> = SCVResolvedProps<InferSCVConfigVariants<Config>, InferSCVConfigExtends<Config>>;

type ContextualSCVConfig<Config> = SCVConfig<
  InferSCVConfigSlotKeys<Config>,
  InferSCVConfigVariants<Config>,
  InferSCVConfigExtends<Config>
>;

export function scv<Config extends SCVConfig<any, any, any>>(
  config: Config & ContextualSCVConfig<Config>
): SCVResult<ResolvedSCVSlotKeys<Config>, InferSCVConfigVariants<Config>, ResolvedSCVProps<Config>> {
  type SlotKeys = InferSCVConfigSlotKeys<Config>;
  type Variants = InferSCVConfigVariants<Config>;
  const extendEntries = config.extend as
    | readonly (SCVResult<string, VariantSchemaBase> | SCVExtendRecord<string>)[]
    | undefined;
  const localSlotNames = collectLocalSlotNames(config.slots as SlotClassMap<SlotKeys> | undefined);

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
  type ResolvedProps = ResolvedSCVProps<Config>;

  const meta: SCVRuntimeMeta = {
    config: config as SCVConfig<
      string,
      Record<string, Record<string, SlotClassMap<string>>>,
      readonly SCVExtendEntry<string>[]
    >,
    defaultVariants,
    kind: 'scv',
    preparedExtends: resolvedExtends,
    resolveRaw: (props?: Record<string, unknown>) => {
      const output = createEmptyRawSlots(slotOrder, slotPlan);
      const selections = resolveSelections(props, defaultVariants);
      const typedProps = props as ResolvedProps | undefined;
      const resolvedProps = {
        ...typedProps,
        ...selections
      } as ResolvedProps;

      for (const source of resolvedExtends) {
        if (source.kind === 'scv') {
          mergeInheritedRaw(output, source.meta.resolveRaw(resolvedProps));
          continue;
        }

        const parts = source.meta.resolveRaw(resolvedProps);
        pushClassParts(output.inheritedShared, source.slot, parts);
      }

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
      }

      return output;
    },
    slotOrder,
    slotPlan
  };

  const recipe: SCVResult<ResolvedSCVSlotKeys<Config>, Variants, ResolvedProps> = (
    props?: ResolvedProps,
    ...merges
  ) => {
    const raw = meta.resolveRaw(props as Record<string, unknown> | undefined);
    const mergeParts = merges.length === 0 ? undefined : buildMergeParts(merges, raw.slotPlan);
    const outputEntries = raw.slotOrder.map(slotName => {
      const baseParts = raw.localUnique[slotName] ?? [];
      const slotParts = mergeParts ? [...baseParts, ...(mergeParts[slotName] ?? [])] : baseParts;

      return [slotName, mergeParts ? mergeTailwindClasses(slotParts) : joinClassParts(slotParts)];
    });

    return Object.fromEntries(outputEntries) as Record<ResolvedSCVSlotKeys<Config>, string>;
  };

  return attachRecipeMeta(recipe, meta);
}

export type { SCVConfig, SCVProps, SCVResult } from './types';
