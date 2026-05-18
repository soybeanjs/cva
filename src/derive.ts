import { attachRecipeMeta, getCVMeta, getSCVMeta, getCurrentRecipeProps } from './internal';
import type { CVRuntimeMeta, SCVRuntimeMeta } from './internal';
import type { ClassValue, CVResult, CVVariantsSchema, SCVResult, VariantSchemaBase } from './types';

type VariantDeriver<Props extends Record<string, unknown>> = (props: Readonly<Props>) => Partial<Props> | undefined;

function mergeVariantProps(
  baseProps: Record<string, unknown> | undefined,
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

function resolveDerivedProps<Props extends Record<string, unknown>>(
  deriveProps: VariantDeriver<Props>,
  props: Record<string, unknown> | undefined
): Record<string, unknown> {
  const incomingProps = mergeVariantProps(undefined, props) as Props;

  return mergeVariantProps(incomingProps, deriveProps(incomingProps) as Record<string, unknown> | undefined);
}

function wrapCVDerive<Variants extends CVVariantsSchema, Props extends Record<string, unknown>>(
  recipe: CVResult<Variants, Props>,
  meta: CVRuntimeMeta,
  deriveProps: VariantDeriver<Props>
): CVResult<Variants, Props> {
  const wrappedMeta: CVRuntimeMeta = {
    ...meta,
    resolveRaw: (props?: Record<string, unknown>) => meta.resolveRaw(resolveDerivedProps(deriveProps, props))
  };
  const wrappedRecipe: CVResult<Variants, Props> = (props?: Props, ...merges: ClassValue[]) =>
    recipe(
      resolveDerivedProps(
        deriveProps,
        (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps()
      ) as Props,
      ...merges
    );

  return attachRecipeMeta(wrappedRecipe, wrappedMeta);
}

function wrapSCVDerive<
  SlotKeys extends string,
  Variants extends VariantSchemaBase,
  Props extends Record<string, unknown>
>(
  recipe: SCVResult<SlotKeys, Variants, Props>,
  meta: SCVRuntimeMeta,
  deriveProps: VariantDeriver<Props>
): SCVResult<SlotKeys, Variants, Props> {
  const wrappedMeta: SCVRuntimeMeta = {
    ...meta,
    resolveRaw: (props?: Record<string, unknown>) => meta.resolveRaw(resolveDerivedProps(deriveProps, props))
  };
  const wrappedRecipe: SCVResult<SlotKeys, Variants, Props> = (
    props?: Props,
    ...merges: (Partial<Record<SlotKeys, ClassValue>> | undefined)[]
  ) =>
    recipe(
      resolveDerivedProps(
        deriveProps,
        (props as Record<string, unknown> | undefined) ?? getCurrentRecipeProps()
      ) as Props,
      ...merges
    );

  return attachRecipeMeta(wrappedRecipe, wrappedMeta);
}

export function derive<Variants extends CVVariantsSchema, Props extends Record<string, unknown>>(
  recipe: CVResult<Variants, Props>,
  deriveProps: (props: Readonly<Props>) => Partial<Props> | undefined
): CVResult<Variants, Props>;
export function derive<
  SlotKeys extends string,
  Variants extends VariantSchemaBase,
  Props extends Record<string, unknown>
>(
  recipe: SCVResult<SlotKeys, Variants, Props>,
  deriveProps: (props: Readonly<Props>) => Partial<Props> | undefined
): SCVResult<SlotKeys, Variants, Props>;
export function derive(
  recipe: CVResult<any, any> | SCVResult<any, any, any>,
  deriveProps: VariantDeriver<Record<string, unknown>>
): CVResult<any, any> | SCVResult<any, any, any> {
  const cvMeta = getCVMeta(recipe);

  if (cvMeta) {
    return wrapCVDerive(recipe as CVResult<any, Record<string, unknown>>, cvMeta, deriveProps);
  }

  const scvMeta = getSCVMeta(recipe);

  if (scvMeta) {
    return wrapSCVDerive(recipe as SCVResult<any, any, Record<string, unknown>>, scvMeta, deriveProps);
  }

  throw new TypeError('derive only accepts cv or scv results.');
}
