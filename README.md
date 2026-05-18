# @soybeanjs/cva

High-performance Tailwind CSS variant recipes with split `cv` and `scv` APIs.

- `cv`: single-output variant recipes that return one class string
- `scv`: multi-slot variant recipes that return a slot-to-class map
- `alias`: remap inherited slot names without changing variant props
- `derive`: compute variant props from incoming props at call time
- `defaults`: preset recipe default variants without rebuilding the recipe
- `extendBase`: compute dynamic base classes or slots from resolved variant props
- `VariantProps`: extract the public variant prop type from a recipe
- runtime overrides use rest arguments instead of `class` / `className` props

## Installation

```bash
pnpm add @soybeanjs/cva
```

```ts
import { alias, cv, derive, defaults, scv } from '@soybeanjs/cva';
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

### `cv` extension

`cv` can extend other `cv` recipes directly.

```ts
import { cv } from '@soybeanjs/cva';

const surface = cv({
  variants: {
    size: {
      sm: 'text-sm',
      lg: 'text-lg'
    },
    tone: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-slate-100 text-slate-900'
    }
  }
});

const button = cv({
  extend: [surface],
  variants: {
    intent: {
      solid: 'shadow-sm'
    }
  }
});
```

Inherited variant props are part of the child recipe type, and child `defaultVariants` / `compoundVariants` can also target inherited variants.

### `cv.extendBase`

Use `extendBase` when the base classes depend on the fully resolved variant props.

```ts
import { cv } from '@soybeanjs/cva';

const button = cv({
  base: 'rounded-md',
  defaultVariants: {
    size: 'sm',
    tone: 'primary'
  },
  extendBase: props => [props.tone === 'primary' ? 'ring-1' : 'ring-0', props.size === 'lg' ? 'px-4' : 'px-2'],
  variants: {
    size: {
      sm: 'text-sm',
      lg: 'text-lg'
    },
    tone: {
      primary: 'bg-blue-500',
      secondary: 'bg-slate-200'
    }
  }
});

button();
// "ring-1 px-2 rounded-md text-sm bg-blue-500"

button({ size: 'lg', tone: 'secondary' });
// "ring-0 px-4 rounded-md text-lg bg-slate-200"
```

`extendBase` runs after inherited `extend` recipes have resolved, and before the local `base` field is appended.

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

### `scv.extendBase`

Use `extendBase` when slot base classes depend on the resolved variant props, or when a slot should be filled by another recipe at call time.

```ts
import { cv, derive, scv } from '@soybeanjs/cva';

const button = cv({
  base: 'inline-flex',
  defaultVariants: {
    fitContent: false,
    size: 'md'
  },
  variants: {
    fitContent: {
      false: '',
      true: 'w-fit h-fit'
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-lg'
    }
  }
});

const iconButton = derive(button, props => ({
  fitContent: true,
  size: props.size === 'lg' ? 'sm' : props.size
}));

const card = scv({
  extendBase: () => ({
    close: iconButton()
  }),
  slots: {
    close: '',
    root: 'rounded-lg'
  }
});

card({ size: 'lg' }).close;
// "inline-flex w-fit h-fit text-xs"
```

Inside `extendBase`, calling another recipe without explicitly passing props reuses the current resolved props. That keeps nested `derive` and `defaults` wrappers composable inside `extendBase`.

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

Direct `cv` extension is still not allowed in `scv`:

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

## Recipe wrappers

Use these helpers when you want to keep recipe metadata intact while changing how variants resolve.

### `derive`

`derive` computes the next variant selection from the incoming props at call time.

```ts
import { cv, derive } from '@soybeanjs/cva';

const button = cv({
  defaultVariants: {
    size: 'md'
  },
  variants: {
    fitContent: {
      false: '',
      true: 'w-fit h-fit'
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-lg'
    }
  }
});

const compactButton = derive(button, props => ({
  fitContent: true,
  size: props.size === 'lg' ? 'sm' : props.size
}));

compactButton();
// incoming props are derived before class resolution

compactButton({ size: 'lg' });
// resolves as if size were 'sm'
```

Use this when the next variants depend on the current call's props.

When a derived recipe is invoked inside `extendBase`, the outer recipe's current resolved props are used if you do not pass props explicitly.

### `defaults`

`defaults` presets a recipe's `defaultVariants` while keeping explicit call-time props higher priority.

```ts
import { cv, defaults } from '@soybeanjs/cva';

const button = cv({
  defaultVariants: {
    fitContent: false,
    size: 'md'
  },
  variants: {
    fitContent: {
      false: '',
      true: 'w-fit h-fit'
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm'
    }
  }
});

const iconButton = defaults(button, {
  fitContent: true,
  size: 'sm'
});

iconButton();
// resolves with fitContent=true and size='sm' as defaults

iconButton({ size: 'md' });
// explicit props still override the new defaults
```

Use this when you want a recipe variant preset, not dynamic remapping.

Like `derive`, a defaulted recipe called inside `extendBase` also inherits the outer recipe's current resolved props when no explicit props are provided.

## `alias`

Use `alias` when you want to inherit an `scv` recipe but expose different slot names in the child recipe.

```ts
import { alias, scv } from '@soybeanjs/cva';

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
  extend: [alias(card, { root: 'header' })],
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
- `extendBase` receives resolved props, which already include inherited and local `defaultVariants` plus the current call's explicit props.
- unknown props are ignored at runtime.
- `tailwind-merge` only runs when runtime override arguments are provided. If you do not pass overrides, the recipe returns the prejoined output directly.

## Development

```bash
pnpm test
pnpm typecheck
pnpm build
```

Benchmark commands are documented in [benchmark/README.md](benchmark/README.md).
