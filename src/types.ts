export type ClassDictionary = Record<string, boolean | null | undefined>;

export type ClassValue = ClassDictionary | ClassValue[] | false | null | number | string | undefined;

export type RecipeClassValue = string | string[];

type PrimitiveVariantValue<Key extends string> = Key extends 'true' | 'false'
  ? boolean
  : Key extends `${number}`
    ? Key | number
    : Key;

type UnionKeys<Union> = Union extends Union ? keyof Union : never;

type MergeObjectUnion<Union> = {
  [Prop in UnionKeys<Union>]?: Union extends Union ? (Prop extends keyof Union ? Union[Prop] : never) : never;
};

export type Simplify<Type> = { [Key in keyof Type]: Type[Key] } & {};

export type VariantSchemaBase = Record<string, Record<string, unknown>>;

export type VariantSelection<Variants extends VariantSchemaBase> = {
  [Key in keyof Variants]?: PrimitiveVariantValue<keyof Variants[Key] & string>;
};

export type CompoundVariantSelection<Variants extends VariantSchemaBase> = {
  [Key in keyof Variants]?:
    | PrimitiveVariantValue<keyof Variants[Key] & string>
    | readonly PrimitiveVariantValue<keyof Variants[Key] & string>[];
};

export type CVVariantsSchema = Record<string, Record<string, RecipeClassValue>>;

type UnknownExtends = readonly unknown[];

type ExtractCVVariantSelection<Source> = Source extends CVResult<infer _Variants, infer Props> ? Props : {};

type MergeSelections<Selections> = Simplify<MergeObjectUnion<Selections>>;

type CVSelectionSet<Variants extends VariantSchemaBase, Extends extends UnknownExtends> = MergeSelections<
  VariantSelection<Variants> | ExtractCVVariantSelection<Extends[number]>
>;

export type CVCompoundVariant<
  Variants extends CVVariantsSchema = CVVariantsSchema,
  Selections extends Record<string, unknown> = VariantSelection<Variants>
> = {
  [Key in keyof Selections]?: Exclude<Selections[Key], undefined> | readonly Exclude<Selections[Key], undefined>[];
} & {
  class?: RecipeClassValue;
  className?: RecipeClassValue;
};

export interface CVResult<
  Variants extends CVVariantsSchema = CVVariantsSchema,
  Props extends Record<string, unknown> = CVProps<Variants>
> {
  (props?: Props, ...merges: ClassValue[]): string;
}

type AnyCVResult = CVResult<any, any>;
type AnySCVResult = SCVResult<any, any, any>;

export type CVExtendEntry = AnyCVResult;

export interface CVConfig<
  Variants extends CVVariantsSchema = CVVariantsSchema,
  Extends extends UnknownExtends = readonly []
> {
  base?: RecipeClassValue;
  compoundVariants?: readonly CVCompoundVariant<NoInfer<Variants>, CVSelectionSet<NoInfer<Variants>, Extends>>[];
  defaultVariants?: Partial<CVSelectionSet<NoInfer<Variants>, Extends>>;
  extend?: Extends;
  variants?: Variants;
}

export type CVProps<Variants extends CVVariantsSchema = CVVariantsSchema> = Simplify<VariantSelection<Variants>>;

export type CVResolvedProps<Variants extends VariantSchemaBase, Extends extends UnknownExtends> = Simplify<
  CVSelectionSet<Variants, Extends>
>;

export type VariantProps<Component extends (...args: any[]) => unknown> = Simplify<
  Exclude<Parameters<Component>[0], undefined>
>;

export type SlotAliasMapping<SlotKeys extends string> = Partial<Record<SlotKeys, string>>;

export type SlotClassMap<SlotKeys extends string> = Partial<Record<SlotKeys, RecipeClassValue>>;

export type SCVVariantsSchema<SlotKeys extends string = string> = Record<
  string,
  Record<string, SlotClassMap<SlotKeys>>
>;

export type SCVCompoundVariant<
  Variants extends VariantSchemaBase,
  SlotKeys extends string = string,
  Selections extends Record<string, unknown> = VariantSelection<Variants>
> = {
  [Key in keyof Selections]?: Exclude<Selections[Key], undefined> | readonly Exclude<Selections[Key], undefined>[];
} & {
  class?: SlotClassMap<SlotKeys>;
  className?: SlotClassMap<SlotKeys>;
};

export type SCVExtendRecord<SlotKeys extends string = string> = Partial<Record<SlotKeys, AnyCVResult>>;

export type SCVExtendEntry<SlotKeys extends string = string> = SCVExtendRecord<SlotKeys> | AnySCVResult;

type ExtractVariantSelection<Source> =
  Source extends SCVResult<any, VariantSchemaBase, infer Props>
    ? Props
    : Source extends object
      ? NonNullable<Source[keyof Source]> extends CVResult<any, infer Props>
        ? Props
        : {}
      : {};

type ExtractSlotKeys<Source> =
  Source extends SCVResult<infer SlotKeys, VariantSchemaBase, infer _Props>
    ? SlotKeys
    : Source extends object
      ? NonNullable<Source[keyof Source]> extends AnyCVResult
        ? keyof Source & string
        : never
      : never;

export type RemappedSlotKeys<
  SlotKeys extends string,
  Mapping extends SlotAliasMapping<SlotKeys>
> = SlotKeys extends keyof Mapping ? (Mapping[SlotKeys] extends string ? Mapping[SlotKeys] : SlotKeys) : SlotKeys;

export type SCVOutputSlotKeys<SlotKeys extends string, Extends extends readonly SCVExtendEntry<SlotKeys>[]> =
  | SlotKeys
  | ExtractSlotKeys<Extends[number]>;

export type SCVOutputSlotKeysLoose<SlotKeys extends string, Extends extends UnknownExtends> =
  | SlotKeys
  | ExtractSlotKeys<Extends[number]>;

type SCVSelectionSet<Variants extends VariantSchemaBase, Extends extends UnknownExtends> = MergeSelections<
  VariantSelection<Variants> | ExtractVariantSelection<Extends[number]>
>;

export interface SCVConfig<
  SlotKeys extends string,
  Variants extends SCVVariantsSchema<SlotKeys> = SCVVariantsSchema<SlotKeys>,
  Extends extends UnknownExtends = readonly []
> {
  extend?: Extends;
  slots?: SlotClassMap<SlotKeys>;
  variants?: Variants;
  compoundVariants?: readonly SCVCompoundVariant<
    NoInfer<Variants>,
    SCVOutputSlotKeysLoose<SlotKeys, Extends>,
    SCVSelectionSet<NoInfer<Variants>, Extends>
  >[];
  defaultVariants?: Partial<SCVSelectionSet<NoInfer<Variants>, Extends>>;
  extendIgnore?: readonly NoInfer<SlotKeys>[];
}

export type SCVProps<Variants extends VariantSchemaBase = VariantSchemaBase> = Simplify<VariantSelection<Variants>>;

export type SCVResolvedProps<Variants extends VariantSchemaBase, Extends extends UnknownExtends> = Simplify<
  SCVSelectionSet<Variants, Extends>
>;

export interface SCVResult<
  SlotKeys extends string = string,
  Variants extends VariantSchemaBase = VariantSchemaBase,
  Props extends Record<string, unknown> = SCVProps<Variants>
> {
  (props?: Props, ...merges: (Partial<Record<SlotKeys, ClassValue>> | undefined)[]): Record<SlotKeys, string>;
}
