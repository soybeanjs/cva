import type { CVConfig, CVVariantsSchema, SCVConfig, SCVExtendEntry, SlotClassMap } from './types';

export const recipeMetadata = Symbol.for('@soybeanjs/cva.metadata');

export interface NormalizedCompoundCondition {
  readonly [variant: string]: readonly string[];
}

export interface NormalizedCVCompoundVariant {
  className: string;
  conditions: NormalizedCompoundCondition;
}

export interface CVRuntimeMeta {
  config: CVConfig<CVVariantsSchema>;
  defaultVariants: Readonly<Record<string, string>>;
  kind: 'cv';
  resolveRaw: (props?: Record<string, unknown>) => string[];
}

export interface SlotBlueprint {}

export interface NormalizedSlotClassParts {
  slots: Readonly<Record<string, readonly string[]>>;
}

export interface NormalizedSCVCompoundVariant {
  classParts: NormalizedSlotClassParts;
  conditions: NormalizedCompoundCondition;
}

export interface RawSlotsResult {
  inheritedShared: Record<string, string[]>;
  inheritedUnique: Record<string, string[]>;
  localShared: Record<string, string[]>;
  localUnique: Record<string, string[]>;
  slotOrder: readonly string[];
  slotPlan: Readonly<Record<string, SlotBlueprint>>;
}

export interface PreparedCVExtend {
  kind: 'cv';
  meta: CVRuntimeMeta;
  slot: string;
}

export interface PreparedSCVExtend {
  kind: 'scv';
  meta: SCVRuntimeMeta;
}

export type PreparedExtend = PreparedCVExtend | PreparedSCVExtend;

export interface SCVRuntimeMeta {
  config: SCVConfig<string, Record<string, Record<string, SlotClassMap<string>>>, readonly SCVExtendEntry<string>[]>;
  defaultVariants: Readonly<Record<string, string>>;
  kind: 'scv';
  preparedExtends: readonly PreparedExtend[];
  resolveRaw: (props?: Record<string, unknown>) => RawSlotsResult;
  slotOrder: readonly string[];
  slotPlan: Readonly<Record<string, SlotBlueprint>>;
}

type RecipeMeta = CVRuntimeMeta | SCVRuntimeMeta;

export function attachRecipeMeta<Result extends (...args: never[]) => unknown, Meta extends RecipeMeta>(
  recipe: Result,
  meta: Meta
): Result {
  Object.defineProperty(recipe, recipeMetadata, {
    configurable: false,
    enumerable: false,
    value: meta,
    writable: false
  });

  return recipe;
}

function readRecipeMeta(candidate: unknown): RecipeMeta | undefined {
  if (typeof candidate !== 'function') {
    return undefined;
  }

  const metadataCarrier = candidate as { [recipeMetadata]?: RecipeMeta };

  return metadataCarrier[recipeMetadata];
}

export function getCVMeta(candidate: unknown): CVRuntimeMeta | undefined {
  const meta = readRecipeMeta(candidate);

  return meta?.kind === 'cv' ? meta : undefined;
}

export function getSCVMeta(candidate: unknown): SCVRuntimeMeta | undefined {
  const meta = readRecipeMeta(candidate);

  return meta?.kind === 'scv' ? meta : undefined;
}
