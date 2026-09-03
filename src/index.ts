import { cn as cnMerge, clsx } from 'cn';

export { alias } from './alias';
export { cv } from './cv';
export { derive } from './derive';
export { scv } from './scv';
export { defaults } from './defaults';

/**
 * Flatten class values into a single class string without resolving Tailwind conflicts.
 *
 * @deprecated Direct alias of `clsx` from the `cn` package. Import `clsx` from `cn` instead.
 */
export const cn: typeof clsx = clsx;

/**
 * Flatten class values and resolve Tailwind conflicts in the result.
 *
 * @deprecated Direct alias of `cn` from the `cn` package. Import `cn` from `cn` instead.
 */
export const merge: typeof cnMerge = cnMerge;

export type {
  ClassValue,
  CVConfig,
  CVExtendEntry,
  CVProps,
  CVResolvedProps,
  CVResult,
  CVVariantsSchema,
  RecipeClassValue,
  RemappedSlotKeys,
  SCVConfig,
  SCVProps,
  SCVResult,
  SCVVariantsSchema,
  SlotAliasMapping,
  SlotClassMap,
  VariantProps,
  VariantSelection
} from './types';
