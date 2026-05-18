import { attachRecipeMeta, getSCVMeta } from './internal';
import type { RawSlotsResult, SCVRuntimeMeta, SlotBlueprint } from './internal';
import type {
  ClassValue,
  RemappedSlotKeys,
  RemappedSCVVariantsSchema,
  AnySCVResult,
  SCVResult,
  ExtractSlotKeys,
  ExtractVariantSchema,
  VariantProps,
  SlotAliasMapping
} from './types';

function remapSlotName(slotName: string, mapping: Readonly<Record<string, string>>): string {
  return mapping[slotName] ?? slotName;
}

function pushRemappedParts(target: Record<string, string[]>, slotName: string, parts: readonly string[]): void {
  if (parts.length === 0) {
    return;
  }

  const current = target[slotName];

  if (current) {
    current.push(...parts);
    return;
  }

  target[slotName] = [...parts];
}

function remapSlotRecord(
  source: Record<string, string[]>,
  mapping: Readonly<Record<string, string>>
): Record<string, string[]> {
  const output: Record<string, string[]> = {};

  for (const [slotName, parts] of Object.entries(source)) {
    pushRemappedParts(output, remapSlotName(slotName, mapping), parts);
  }

  return output;
}

function setSlotPlanEntry(
  slotPlan: Record<string, SlotBlueprint>,
  slotOrder: string[],
  slotName: string,
  blueprint: SlotBlueprint
): void {
  const existingIndex = slotOrder.indexOf(slotName);

  if (existingIndex >= 0) {
    slotOrder.splice(existingIndex, 1);
  }

  slotOrder.push(slotName);
  slotPlan[slotName] = blueprint;
}

function remapSlotPlan(
  slotOrder: readonly string[],
  slotPlan: Readonly<Record<string, SlotBlueprint>>,
  mapping: Readonly<Record<string, string>>
): { slotOrder: readonly string[]; slotPlan: Readonly<Record<string, SlotBlueprint>> } {
  const remappedOrder: string[] = [];
  const remappedPlan: Record<string, SlotBlueprint> = {};

  for (const slotName of slotOrder) {
    const remappedSlotName = remapSlotName(slotName, mapping);

    setSlotPlanEntry(remappedPlan, remappedOrder, remappedSlotName, slotPlan[slotName]);
  }

  return {
    slotOrder: remappedOrder,
    slotPlan: remappedPlan
  };
}

function remapRawSlots(raw: RawSlotsResult, mapping: Readonly<Record<string, string>>): RawSlotsResult {
  const remappedConfig = remapSlotPlan(raw.slotOrder, raw.slotPlan, mapping);

  return {
    inheritedShared: remapSlotRecord(raw.inheritedShared, mapping),
    inheritedUnique: remapSlotRecord(raw.inheritedUnique, mapping),
    localShared: remapSlotRecord(raw.localShared, mapping),
    localUnique: remapSlotRecord(raw.localUnique, mapping),
    slotOrder: remappedConfig.slotOrder,
    slotPlan: remappedConfig.slotPlan
  };
}

function remapRecipeOutput(
  output: Record<string, string>,
  mapping: Readonly<Record<string, string>>
): Record<string, string> {
  const remapped: Record<string, string> = {};

  for (const [slotName, className] of Object.entries(output)) {
    remapped[remapSlotName(slotName, mapping)] = className;
  }

  return remapped;
}

function invertMapping(mapping: Readonly<Record<string, string>>): Record<string, string> {
  const reversed: Record<string, string> = {};

  for (const [source, target] of Object.entries(mapping)) {
    reversed[target] = source;
  }

  return reversed;
}

function remapMergeEntry(
  mergeEntry: Partial<Record<string, ClassValue>>,
  mapping: Readonly<Record<string, string>>
): Partial<Record<string, ClassValue>> {
  const remapped: Partial<Record<string, ClassValue>> = {};

  for (const [slotName, values] of Object.entries(mergeEntry)) {
    remapped[remapSlotName(slotName, mapping)] = values;
  }

  return remapped;
}

export function alias<Recipe extends AnySCVResult, Mapping extends SlotAliasMapping<ExtractSlotKeys<Recipe>>>(
  recipe: Recipe,
  mapping: Mapping
): AnySCVResult &
  SCVResult<
    RemappedSlotKeys<ExtractSlotKeys<Recipe>, Mapping>,
    RemappedSCVVariantsSchema<ExtractVariantSchema<Recipe>, Mapping>,
    VariantProps<Recipe>
  > {
  const meta = getSCVMeta(recipe);

  if (!meta) {
    throw new TypeError('alias only accepts scv results.');
  }

  const normalizedMapping = Object.fromEntries(
    Object.entries(mapping).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
  const reverseMapping = invertMapping(normalizedMapping);
  const remappedConfig = remapSlotPlan(meta.slotOrder, meta.slotPlan, normalizedMapping);
  const wrappedMeta: SCVRuntimeMeta = {
    ...meta,
    resolveRaw: (props?: Record<string, unknown>) => remapRawSlots(meta.resolveRaw(props), normalizedMapping),
    slotOrder: remappedConfig.slotOrder,
    slotPlan: remappedConfig.slotPlan
  };
  const wrappedRecipe: AnySCVResult &
    SCVResult<
      RemappedSlotKeys<ExtractSlotKeys<Recipe>, Mapping>,
      RemappedSCVVariantsSchema<ExtractVariantSchema<Recipe>, Mapping>,
      VariantProps<Recipe>
    > = (props?: VariantProps<Recipe>, ...merges) => {
    const sourceMerges = (merges.filter(Boolean) as Partial<Record<ExtractSlotKeys<Recipe>, ClassValue>>[]).map(
      mergeEntry => remapMergeEntry(mergeEntry, reverseMapping)
    );

    return remapRecipeOutput(recipe(props, ...sourceMerges), normalizedMapping) as Record<
      RemappedSlotKeys<ExtractSlotKeys<Recipe>, Mapping>,
      string
    >;
  };

  return attachRecipeMeta(wrappedRecipe, wrappedMeta);
}
