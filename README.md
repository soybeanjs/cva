# @soybeanjs/cva

High-performance Tailwind CSS variant recipes with split `cv` and `scv` APIs.

- `cv`: single-output variant recipes that return one class string
- `scv`: multi-slot variant recipes that return a slot-to-class map
- `aliasSlots`: remap inherited slot names without changing variant props
- `VariantProps`: extract the public variant prop type from a recipe
- runtime overrides use rest arguments instead of `class` / `className` props

## Installation

```bash
pnpm add @soybeanjs/cva
```

```ts
import { aliasSlots, cv, scv } from '@soybeanjs/cva';
import type { VariantProps } from '@soybeanjs/cva';
```

## Why split `cv` and `scv`

This package keeps the two common recipe shapes separate:

- use `cv` when the result is one final class string
- use `scv` when the result is a record of named slots

That split keeps the runtime small, keeps the types direct, and avoids overloading a single API with two different output models.

## `cv`

Use `cv` for a single class string.

```ts
import { cv } from '@soybeanjs/cva';

const button = cv({
  base: 'inline-flex items-center rounded-md font-medium',
  defaultVariants: {
    size: 'md',
    tone: 'primary'
  },
  variants: {
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base'
    },
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-100 text-slate-900'
    },
    disabled: {
      false: 'opacity-100',
      true: 'pointer-events-none opacity-50'
    }
  },
  compoundVariants: [
    {
      class: 'shadow-sm',
      size: 'lg',
      tone: 'primary'
    }
  ]
});

button();
// "inline-flex items-center rounded-md font-medium h-10 px-4 text-sm bg-blue-600 text-white opacity-100"

button({ size: 'lg', tone: 'secondary' });
// "inline-flex items-center rounded-md font-medium h-12 px-5 text-base bg-slate-100 text-slate-900 opacity-100"
```

### `cv` runtime overrides

Pass extra classes through rest arguments:

```ts
button({ size: 'lg' }, 'mt-4', ['shadow-lg', 'ring-1']);
```

Overrides are applied after all base, variant, and compound classes.

## `scv`

Use `scv` when each slot needs its own final class string.

```ts
import { scv } from '@soybeanjs/cva';

const card = scv({
  slots: {
    root: 'rounded-lg border p-4',
    header: 'mb-2 font-semibold',
    body: 'text-sm'
  },
  defaultVariants: {
    tone: 'neutral'
  },
  variants: {
    tone: {
      neutral: {
        root: 'border-slate-200 bg-white',
        body: 'text-slate-600'
      },
      brand: {
        root: 'border-blue-200 bg-blue-50',
        body: 'text-blue-900'
      }
    },
    compact: {
      false: {},
      true: {
        root: 'p-3',
        header: 'mb-1',
        body: 'text-xs'
      }
    }
  },
  compoundVariants: [
    {
      class: {
        root: 'shadow-sm'
      },
      compact: false,
      tone: 'brand'
    }
  ]
});

card({ tone: 'brand' });
// {
//   root: 'rounded-lg border p-4 border-blue-200 bg-blue-50 shadow-sm',
//   header: 'mb-2 font-semibold',
//   body: 'text-sm text-blue-900'
// }
```

### `scv` runtime overrides

`scv` overrides are also rest arguments, but each argument is a slot map.

```ts
card({ tone: 'brand' }, { root: ['mt-4', 'shadow-lg'] }, { body: ['leading-6'] });
```

Each slot is merged independently.

## Extending recipes

`scv` can extend:

- another `scv` recipe
- a slot-mapped `cv` recipe, such as `{ root: someCvRecipe }`

```ts
import { cv, scv } from '@soybeanjs/cva';

const surface = cv({
  variants: {
    tone: {
      neutral: 'bg-white text-slate-900',
      brand: 'bg-blue-600 text-white'
    }
  }
});

const panel = scv({
  extend: [{ root: surface }],
  slots: {
    root: 'rounded-xl p-4',
    title: 'font-semibold'
  },
  variants: {
    tone: {
      neutral: {},
      brand: {}
    },
    size: {
      sm: {
        root: 'p-3',
        title: 'text-sm'
      },
      lg: {
        root: 'p-6',
        title: 'text-lg'
      }
    }
  }
});
```

Direct `cv` extension is intentionally not allowed:

```ts
// not supported
scv({
  extend: [surface]
});
```

Map the `cv` recipe to a slot instead:

```ts
scv({
  extend: [{ root: surface }]
});
```

## `aliasSlots`

Use `aliasSlots` when you want to inherit an `scv` recipe but expose different slot names in the child recipe.

```ts
import { aliasSlots, scv } from '@soybeanjs/cva';

const card = scv({
  slots: {
    root: 'rounded-md',
    body: 'p-4'
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-slate-900',
        body: 'text-white'
      }
    }
  }
});

const sectionCard = scv({
  extend: [aliasSlots(card, { root: 'header' })],
  slots: {
    header: 'font-semibold'
  },
  variants: {
    tone: {
      primary: {
        header: 'uppercase'
      }
    }
  }
});

sectionCard({ tone: 'primary' });
// {
//   body: 'p-4 text-white',
//   header: 'rounded-md bg-slate-900 font-semibold uppercase'
// }
```

Aliases also apply to merge input. If a parent slot was renamed from `root` to `header`, runtime overrides should target `header`.

## `VariantProps`

Extract the public variant props directly from a recipe.

```ts
import { cv, scv } from '@soybeanjs/cva';
import type { VariantProps } from '@soybeanjs/cva';

const button = cv({
  variants: {
    size: {
      sm: 'text-sm',
      lg: 'text-lg'
    }
  }
});

type ButtonProps = VariantProps<typeof button>;
// { size?: 'sm' | 'lg' }

const card = scv({
  extend: [{ root: button }],
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-500'
      }
    }
  }
});

type CardProps = VariantProps<typeof card>;
// { size?: 'sm' | 'lg'; tone?: 'primary' }
```

Inherited variant props from `extend` are included in the extracted type.

## Notes

- `root` has no built-in meaning. It is just a conventional slot name.
- boolean variants are declared with `'true'` and `'false'` keys and exposed as `boolean` in props.
- compound variant conditions can use either a single value or an array of values.
- unknown props are ignored at runtime.
- `tailwind-merge` only runs when runtime override arguments are provided. If you do not pass overrides, the recipe returns the prejoined output directly.

## Development

```bash
pnpm test
pnpm typecheck
pnpm build
```

Benchmark commands are documented in [benchmark/README.md](benchmark/README.md).
