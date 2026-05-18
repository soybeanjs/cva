import type { PreparedExtend, RawSlotsResult, SlotBlueprint } from './internal';

function pushParts(target: Record<string, string[]>, key: string, parts: readonly string[]): void {
  if (parts.length === 0) {
    return;
  }

  const current = target[key];

  if (current) {
    current.push(...parts);
    return;
  }

  target[key] = [...parts];
}

function setSlotBlueprint(
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

function collectInheritedSlots(preparedExtends: readonly PreparedExtend[]): {
  slotOrder: string[];
  slotPlan: Record<string, SlotBlueprint>;
} {
  const slotOrder: string[] = [];
  const slotPlan: Record<string, SlotBlueprint> = {};

  for (const source of preparedExtends) {
    if (source.kind !== 'scv') {
      continue;
    }

    for (const slotName of source.meta.slotOrder) {
      setSlotBlueprint(slotPlan, slotOrder, slotName, source.meta.slotPlan[slotName]);
    }
  }

  return { slotOrder, slotPlan };
}

export function mergeConfig(
  slotNames: readonly string[],
  preparedExtends: readonly PreparedExtend[],
  mappedSlots: readonly string[]
): { slotOrder: readonly string[]; slotPlan: Readonly<Record<string, SlotBlueprint>> } {
  const { slotOrder: inheritedOrder, slotPlan: inheritedPlan } = collectInheritedSlots(preparedExtends);
  const currentSlots = [...slotNames];

  for (const mappedSlot of mappedSlots) {
    if (!currentSlots.includes(mappedSlot)) {
      currentSlots.push(mappedSlot);
    }
  }

  if (
    currentSlots.length === 0 &&
    inheritedOrder.length === 0 &&
    preparedExtends.some(source => source.kind === 'cv')
  ) {
    currentSlots.push('root');
  }

  const currentSlotPlan: Record<string, SlotBlueprint> = {};
  const currentOrder: string[] = [];

  for (const slotName of currentSlots) {
    currentOrder.push(slotName);
    currentSlotPlan[slotName] = {};
  }

  const finalOrder: string[] = [];
  const finalPlan: Record<string, SlotBlueprint> = {};

  for (const slotName of inheritedOrder) {
    finalOrder.push(slotName);
    finalPlan[slotName] = inheritedPlan[slotName];
  }

  for (const slotName of currentOrder) {
    setSlotBlueprint(finalPlan, finalOrder, slotName, currentSlotPlan[slotName]);
  }

  if (finalOrder.length === 0) {
    finalOrder.push('root');
    finalPlan.root = {};
  }

  return {
    slotOrder: finalOrder,
    slotPlan: finalPlan
  };
}

export function createEmptyRawSlots(
  slotOrder: readonly string[],
  slotPlan: Readonly<Record<string, SlotBlueprint>>
): RawSlotsResult {
  return {
    inheritedShared: {},
    inheritedUnique: {},
    localShared: {},
    localUnique: {},
    slotOrder,
    slotPlan
  };
}

export function mergeInheritedRaw(target: RawSlotsResult, source: RawSlotsResult): void {
  for (const [sharedKey, parts] of Object.entries(source.inheritedShared)) {
    pushParts(target.inheritedShared, sharedKey, parts);
  }

  for (const [sharedKey, parts] of Object.entries(source.localShared)) {
    pushParts(target.inheritedShared, sharedKey, parts);
  }

  for (const [slotName, parts] of Object.entries(source.inheritedUnique)) {
    if (slotName in target.slotPlan) {
      pushParts(target.inheritedUnique, slotName, parts);
    }
  }

  for (const [slotName, parts] of Object.entries(source.localUnique)) {
    if (slotName in target.slotPlan) {
      pushParts(target.inheritedUnique, slotName, parts);
    }
  }
}

export function pushClassParts(target: Record<string, string[]>, key: string, parts: readonly string[]): void {
  pushParts(target, key, parts);
}
