export type Simplify<Type> = { [Key in keyof Type]: Type[Key] } & {};

type UnionKeys<Union> = Union extends Union ? keyof Union : never;

type MergeObjectUnion<Union> = {
  [Prop in UnionKeys<Union>]?: Union extends Union ? (Prop extends keyof Union ? Union[Prop] : never) : never;
};

export type ClassDictionary = Record<string, boolean | null | undefined>;

export type ClassValue = ClassDictionary | ClassValue[] | false | null | number | string | undefined;

export type RecipeClassValue = string | string[];

type PrimitiveVariantValue<Key extends string> = Key extends 'true' | 'false'
  ? boolean
  : Key extends `${number}`
    ? Key | number
    : Key;

export type VariantSchemaBase = Record<string, Record<string, unknown>>;

export type VariantSelection<Variants extends VariantSchemaBase | undefined = VariantSchemaBase | undefined> =
  Variants extends VariantSchemaBase
    ? {
        [Key in keyof Variants]?: PrimitiveVariantValue<keyof Variants[Key] & string>;
      }
    : {};

export type CVVariantsSchema = Record<string, Record<string, RecipeClassValue>>;

type ExtractCVVariantSelection<Source> = Source extends CVResult<infer _Variants, infer Props> ? Props : {};

type MergeSelections<Selections> = Simplify<MergeObjectUnion<Selections>>;

type CVSelectionSet<
  Variants extends VariantSchemaBase | undefined,
  Extends extends readonly unknown[]
> = MergeSelections<VariantSelection<Variants> | ExtractCVVariantSelection<Extends[number]>>;

export type CVCompoundVariant<Selections extends Record<string, unknown> = VariantSelection> = {
  [Key in keyof Selections]?: Exclude<Selections[Key], undefined> | readonly Exclude<Selections[Key], undefined>[];
} & {
  class?: RecipeClassValue;
  className?: RecipeClassValue;
};

export interface CVResult<
  Variants extends CVVariantsSchema | undefined = CVVariantsSchema | undefined,
  Props extends Record<string, unknown> = CVProps<Variants>
> {
  (props?: Props, ...merges: ClassValue[]): string;
}

export type AnyCVResult = CVResult<any, any>;

export type CVExtendEntry = AnyCVResult;

export interface CVConfig<
  Variants extends CVVariantsSchema | undefined = CVVariantsSchema | undefined,
  Extends extends readonly AnyCVResult[] = readonly []
> {
  base?: RecipeClassValue;
  extendBase?: (props: CVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>) => RecipeClassValue;
  compoundVariants?: readonly CVCompoundVariant<CVSelectionSet<NoInfer<Variants>, NoInfer<Extends>>>[];
  defaultVariants?: Partial<CVSelectionSet<NoInfer<Variants>, NoInfer<Extends>>>;
  extend?: Extends;
  variants?: Variants;
}

export type CVProps<Variants extends CVVariantsSchema | undefined = CVVariantsSchema | undefined> = Simplify<
  VariantSelection<Variants>
>;

export type CVResolvedProps<
  Variants extends VariantSchemaBase | undefined,
  Extends extends readonly unknown[]
> = Simplify<CVSelectionSet<Variants, Extends>>;

export type SlotAliasMapping<SlotKeys extends string> = Partial<Record<SlotKeys, string>>;

export type SlotClassMap<SlotKeys extends string> = Partial<Record<SlotKeys, RecipeClassValue>>;

export type SCVVariantsSchema<SlotKeys extends string = string> = Record<
  string,
  Record<string, SlotClassMap<SlotKeys>>
>;

export type SCVCompoundVariant<
  SlotKeys extends string = string,
  Selections extends Record<string, unknown> = VariantSelection
> = {
  [Key in keyof Selections]?: Exclude<Selections[Key], undefined> | readonly Exclude<Selections[Key], undefined>[];
} & {
  class?: SlotClassMap<SlotKeys>;
  className?: SlotClassMap<SlotKeys>;
};

type ExtractVariantSelection<Source> = Source extends SCVResult<any, VariantSchemaBase, infer Props> ? Props : {};

export type ExtractSlotKeys<Source> =
  Source extends SCVResult<infer SlotKeys, VariantSchemaBase, infer _Props> ? SlotKeys : never;

export type ExtractVariantSchema<Source> =
  Source extends SCVResult<any, infer Variants, infer _Props> ? Variants : never;

export type RemappedSlotKeys<
  SlotKeys extends string,
  Mapping extends SlotAliasMapping<SlotKeys>
> = SlotKeys extends keyof Mapping ? (Mapping[SlotKeys] extends string ? Mapping[SlotKeys] : SlotKeys) : SlotKeys;

type RemapSlotKey<Key extends string, Mapping extends Partial<Record<string, string>>> = Key extends keyof Mapping
  ? Mapping[Key] extends string
    ? Mapping[Key]
    : Key
  : Key;

type RemapSlotClassMap<ClassMap, Mapping extends Partial<Record<string, string>>> =
  ClassMap extends Record<string, unknown>
    ? Simplify<{
        [Key in keyof ClassMap as Key extends string ? RemapSlotKey<Key, Mapping> : never]: ClassMap[Key];
      }>
    : ClassMap;

export type RemappedSCVVariantsSchema<
  Variants extends VariantSchemaBase | undefined,
  Mapping extends Partial<Record<string, string>>
> = Variants extends VariantSchemaBase
  ? {
      [VariantName in keyof Variants]: {
        [VariantValue in keyof Variants[VariantName]]: RemapSlotClassMap<Variants[VariantName][VariantValue], Mapping>;
      };
    }
  : Variants;

type SCVSelectionSet<
  Variants extends VariantSchemaBase | undefined,
  Extends extends readonly unknown[]
> = MergeSelections<VariantSelection<Variants> | ExtractVariantSelection<Extends[number]>>;

export type SCVOutputSlotKeys<SlotKeys extends string, Extends extends readonly unknown[]> =
  | SlotKeys
  | ExtractSlotKeys<Extends[number]>;

export type AnySCVResult = SCVResult<any, any, any>;

export interface SCVConfig<
  SlotKeys extends string,
  Extends extends readonly AnySCVResult[] = readonly [],
  Variants extends SCVVariantsSchema<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>> | undefined =
    | SCVVariantsSchema<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>>
    | undefined
> {
  extend?: Extends;
  extendIgnore?: readonly NoInfer<ExtractSlotKeys<NoInfer<Extends>[number]>>[];
  extendBase?: (
    props: SCVResolvedProps<NoInfer<Variants>, NoInfer<Extends>>
  ) => SlotClassMap<SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>>;
  slots?: SlotClassMap<SlotKeys>;
  variants?: Variants;
  compoundVariants?: readonly SCVCompoundVariant<
    SCVOutputSlotKeys<NoInfer<SlotKeys>, NoInfer<Extends>>,
    SCVSelectionSet<NoInfer<Variants>, NoInfer<Extends>>
  >[];
  defaultVariants?: Partial<SCVSelectionSet<NoInfer<Variants>, NoInfer<Extends>>>;
}

export type SCVProps<Variants extends VariantSchemaBase | undefined = VariantSchemaBase | undefined> = Simplify<
  VariantSelection<Variants>
>;

export type SCVResolvedProps<
  Variants extends VariantSchemaBase | undefined,
  Extends extends readonly unknown[]
> = Simplify<SCVSelectionSet<Variants, Extends>>;

export interface SCVResult<
  SlotKeys extends string = string,
  Variants extends VariantSchemaBase | undefined = VariantSchemaBase | undefined,
  Props extends Record<string, unknown> = SCVProps<Variants>
> {
  (props?: Props, ...merges: (Partial<Record<SlotKeys, ClassValue>> | undefined)[]): Record<SlotKeys, string>;
}

export type VariantProps<Component extends (...args: any[]) => unknown> = Simplify<
  Exclude<Parameters<Component>[0], undefined>
>;
