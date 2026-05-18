import { describe, expect, it } from 'vitest';
import { alias, cn, cv, defaults, derive, scv } from '../src/index';
import type { VariantProps } from '../src/index';

type IsEqual<Left, Right> =
  (<Type>() => Type extends Left ? 1 : 2) extends <Type>() => Type extends Right ? 1 : 2 ? true : false;

type Assert<Type extends true> = Type;

describe('cv', () => {
  it('exports cn with css-variants style class flattening', () => {
    expect(
      cn('inline-flex', ['items-center', 0, false, ['justify-center']], { 'font-medium': true, hidden: false })
    ).toBe('inline-flex items-center justify-center font-medium');
  });

  it('exposes VariantProps for cv results', () => {
    const button = cv({
      variants: {
        disabled: {
          false: 'opacity-100',
          true: 'opacity-50'
        },
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        },
        tone: {
          danger: 'bg-red-500',
          primary: 'bg-blue-500'
        }
      }
    });

    type ButtonProps = VariantProps<typeof button>;
    const buttonPropsAssertion: Assert<
      IsEqual<
        ButtonProps,
        {
          disabled?: boolean;
          size?: 'lg' | 'sm';
          tone?: 'danger' | 'primary';
        }
      >
    > = true;

    const validProps: ButtonProps = { disabled: true, size: 'lg', tone: 'primary' };

    expect(button(validProps)).toBe('opacity-50 text-lg bg-blue-500');
    expect(buttonPropsAssertion).toBe(true);

    // @ts-expect-error invalid variants are not part of VariantProps
    const invalidProps: ButtonProps = { invalid: 'ignored' };

    void invalidProps;
  });

  it('supports base, variants, defaultVariants and compoundVariants while ignoring invalid props', () => {
    const button = cv({
      base: 'inline-flex px-2',
      variants: {
        disabled: {
          false: 'opacity-100',
          true: 'opacity-50'
        },
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        },
        tone: {
          danger: 'bg-red-500',
          primary: 'bg-blue-500'
        }
      },
      compoundVariants: [
        {
          class: 'uppercase',
          size: 'lg',
          tone: 'primary'
        },
        {
          class: 'cursor-not-allowed',
          disabled: true,
          tone: ['primary', 'danger']
        }
      ],
      defaultVariants: {
        disabled: false,
        size: 'sm'
      }
    });

    expect(button()).toBe('inline-flex px-2 opacity-100 text-sm');
    expect(button({ disabled: true, size: 'lg', tone: 'primary' })).toBe(
      'inline-flex px-2 opacity-50 text-lg bg-blue-500 uppercase cursor-not-allowed'
    );
    expect(button({ invalid: 'ignored', size: 'lg', tone: 'primary' } as never)).toBe(
      'inline-flex px-2 opacity-100 text-lg bg-blue-500 uppercase'
    );
  });

  it('applies merges after all variants and only lets later merges win conflicts', () => {
    const button = cv({
      base: 'inline-flex px-2',
      defaultVariants: {
        size: 'sm'
      },
      variants: {
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        }
      }
    });

    expect(button({ size: 'lg' }, ['mt-1', 'shadow-lg'], 'mt-4')).toBe('inline-flex px-2 text-lg shadow-lg mt-4');
  });

  it('resolves extendBase from merged variants before local base classes', () => {
    const button = cv({
      base: 'rounded-md',
      defaultVariants: {
        size: 'sm',
        tone: 'primary'
      },
      extendBase: props => [props?.tone === 'primary' ? 'ring-1' : 'ring-0', props?.size === 'lg' ? 'px-4' : 'px-2'],
      variants: {
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        },
        tone: {
          primary: 'bg-blue-500',
          secondary: 'bg-slate-200'
        }
      }
    });

    expect(button()).toBe('ring-1 px-2 rounded-md text-sm bg-blue-500');
    expect(button({ size: 'lg', tone: 'secondary' })).toBe('ring-0 px-4 rounded-md text-lg bg-slate-200');
  });

  it('preserves boolean runtime props for extendBase and defaults wrappers', () => {
    const button = cv({
      extendBase: props => (props.disabled ? 'is-disabled' : 'is-enabled'),
      defaultVariants: {
        disabled: false
      },
      variants: {
        disabled: {
          false: 'opacity-100',
          true: 'opacity-50'
        }
      }
    });

    const disabledButton = defaults(button, {
      disabled: true
    });

    expect(button()).toBe('is-enabled opacity-100');
    expect(button({ disabled: true })).toBe('is-disabled opacity-50');
    expect(disabledButton()).toBe('is-disabled opacity-50');
  });

  it('supports cv extension with inherited VariantProps and defaults', () => {
    const surface = cv({
      base: 'rounded-md',
      defaultVariants: {
        size: 'sm'
      },
      variants: {
        disabled: {
          false: 'opacity-100',
          true: 'opacity-50'
        },
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        },
        tone: {
          primary: 'bg-blue-500',
          secondary: 'bg-slate-200'
        }
      }
    });

    const button = cv({
      extend: [surface],
      base: 'font-medium',
      variants: {
        intent: {
          solid: 'shadow-sm'
        }
      },
      compoundVariants: [
        {
          class: 'uppercase',
          intent: 'solid',
          size: 'sm'
        }
      ],
      defaultVariants: {
        tone: 'primary'
      }
    });

    type ButtonProps = VariantProps<typeof button>;
    const buttonPropsAssertion: Assert<
      IsEqual<
        ButtonProps,
        {
          disabled?: boolean;
          intent?: 'solid';
          size?: 'lg' | 'sm';
          tone?: 'primary' | 'secondary';
        }
      >
    > = true;

    const extendSelf = cv({
      extend: [surface],
      defaultVariants: {
        size: 'lg',
        disabled: true
      }
    });

    type ExtendSelfProps = VariantProps<typeof extendSelf>;
    const extendSelfPropsAssertion: Assert<
      IsEqual<
        ExtendSelfProps,
        {
          disabled?: boolean;
          size?: 'lg' | 'sm';
          tone?: 'primary' | 'secondary';
        }
      >
    > = true;

    expect(button({ intent: 'solid' })).toBe('rounded-md text-sm bg-blue-500 font-medium shadow-sm uppercase');
    expect(button({ intent: 'solid', size: 'lg', tone: 'secondary' })).toBe(
      'rounded-md text-lg bg-slate-200 font-medium shadow-sm'
    );
    expect(extendSelf()).toBe('rounded-md opacity-50 text-lg');
    expect(extendSelfPropsAssertion).toBe(true);
    expect(buttonPropsAssertion).toBe(true);
  });

  it('derives incoming variants without rewriting recipe defaults and keeps scv.extend compatibility', () => {
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
          md: 'text-sm',
          sm: 'text-xs'
        }
      }
    });

    const iconButton = derive(button, props =>
      props.size ? { fitContent: true, size: 'sm' as const } : { fitContent: true }
    );

    const card = scv({
      extendBase: () => ({
        close: iconButton()
      }),
      slots: {
        close: '',
        root: 'rounded-lg'
      }
    });

    expect(button()).toBe('inline-flex text-sm');
    expect(iconButton()).toBe('inline-flex w-fit h-fit text-sm');
    expect(card({ size: 'sm' }).close).toBe('inline-flex w-fit h-fit text-xs');
  });

  it('derives variants before resolving classes while preserving scv.extend compatibility', () => {
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
          lg: 'text-lg',
          md: 'text-sm',
          sm: 'text-xs'
        }
      }
    });

    const iconButton = derive(button, props => ({
      fitContent: true,
      size: props.size === 'lg' ? ('sm' as const) : ('lg' as const)
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

    expect(iconButton()).toBe('inline-flex w-fit h-fit text-lg');
    expect(iconButton({ size: 'lg' })).toBe('inline-flex w-fit h-fit text-xs');
    expect(card({ size: 'lg' }).close).toBe('inline-flex w-fit h-fit text-xs');
  });

  it('presets defaultVariants and keeps scv.extend compatibility', () => {
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
          md: 'text-sm',
          sm: 'text-xs'
        }
      }
    });

    const iconButton = defaults(button, {
      fitContent: true,
      size: 'sm'
    });

    const card = scv({
      extendBase: () => ({
        close: iconButton()
      }),
      slots: {
        close: '',
        root: 'rounded-lg'
      }
    });

    expect(button()).toBe('inline-flex text-sm');
    expect(iconButton()).toBe('inline-flex w-fit h-fit text-xs');
    expect(iconButton({ size: 'md' })).toBe('inline-flex w-fit h-fit text-sm');
    expect(card().close).toBe('inline-flex w-fit h-fit text-xs');
  });
});

describe('scv', () => {
  it('exposes VariantProps for scv results', () => {
    const baseCard = scv({
      slots: {
        root: 'rounded-md',
        body: 'p-4'
      },
      variants: {
        size: {
          lg: {
            root: 'text-lg',
            body: 'text-lg'
          },
          sm: {
            root: 'text-sm',
            body: 'text-sm'
          }
        }
      }
    });

    const card = scv({
      extend: [baseCard],
      variants: {
        tone: {
          primary: {
            root: 'bg-blue-500'
          }
        }
      }
    });

    type CardProps = VariantProps<typeof card>;
    const cardPropsAssertion: Assert<
      IsEqual<
        CardProps,
        {
          size?: 'lg' | 'sm';
          tone?: 'primary';
        }
      >
    > = true;

    const validProps: CardProps = { size: 'lg', tone: 'primary' };

    expect(card(validProps).root).toBe('rounded-md text-lg bg-blue-500');
    expect(cardPropsAssertion).toBe(true);

    // @ts-expect-error invalid variants are not part of VariantProps
    const invalidProps: CardProps = { intent: 'ghost' };

    void invalidProps;
  });

  it('supports multi-slot base, variants, compoundVariants and defaultVariants', () => {
    const card = scv({
      slots: {
        body: 'text-sm',
        root: 'rounded-lg p-2'
      },
      compoundVariants: [
        {
          class: {
            root: 'ring-1'
          },
          tone: 'primary'
        }
      ],
      defaultVariants: {
        tone: 'primary'
      },
      variants: {
        tone: {
          primary: {
            body: 'text-white',
            root: 'bg-blue-500'
          }
        }
      }
    });

    expect(card()).toEqual({
      body: 'text-sm text-white',
      root: 'rounded-lg p-2 bg-blue-500 ring-1'
    });
  });

  it('preserves boolean runtime props for scv extendBase', () => {
    const card = scv({
      extendBase: props => ({
        root: props.collapsible ? 'is-collapsible' : 'is-static'
      }),
      defaultVariants: {
        collapsible: false
      },
      slots: {
        root: 'rounded-lg'
      },
      variants: {
        collapsible: {
          false: {
            root: 'opacity-100'
          },
          true: {
            root: 'opacity-50'
          }
        }
      }
    });

    expect(card()).toEqual({
      root: 'is-static rounded-lg opacity-100'
    });

    expect(card({ collapsible: true })).toEqual({
      root: 'is-collapsible rounded-lg opacity-50'
    });
  });

  it('applies scv merges after all variants and resolves conflicts per slot', () => {
    const card = scv({
      slots: {
        body: 'px-2',
        root: 'mt-1 p-2'
      },
      variants: {
        size: {
          lg: {
            body: 'px-4',
            root: 'mt-2'
          }
        }
      }
    });

    expect(
      card({ size: 'lg' }, { root: ['mt-3', 'shadow-lg'] }, { body: ['px-6', 'py-2'] }, { root: ['mt-4'] })
    ).toEqual({
      body: 'px-6 py-2',
      root: 'p-2 shadow-lg mt-4'
    });
  });

  it('supports alias remapping across scv extensions', () => {
    const baseCard = scv({
      slots: {
        root: 'rounded-md',
        body: 'p-4'
      },
      variants: {
        tone: {
          primary: {
            body: 'text-white',
            root: 'bg-slate-900'
          }
        }
      },
      compoundVariants: [
        {
          tone: 'primary',
          class: {
            root: 'ring-1'
          }
        }
      ]
    });

    const sectionCard = scv({
      extend: [alias(baseCard, { root: 'header' })],
      slots: {
        header: 'font-semibold'
      },
      variants: {
        tone: {
          primary: {
            header: 'uppercase'
          }
        }
      },
      compoundVariants: [
        {
          class: {
            body: 'tracking-wide'
          },
          tone: 'primary'
        }
      ]
    });

    expect(sectionCard({ tone: 'primary' })).toEqual({
      body: 'p-4 text-white tracking-wide',
      header: 'rounded-md bg-slate-900 ring-1 font-semibold uppercase'
    });
  });

  it('remaps inherited root and item slots to subRoot and subItem', () => {
    const listA = scv({
      slots: {
        item: 'px-2',
        root: 'rounded-md'
      },
      compoundVariants: [
        {
          class: {
            item: 'font-medium'
          },
          tone: 'primary'
        }
      ],
      defaultVariants: {
        tone: 'primary'
      },
      variants: {
        tone: {
          primary: {
            item: 'text-white',
            root: 'bg-slate-900'
          }
        }
      }
    });

    const listB = scv({
      extend: [alias(listA, { item: 'subItem', root: 'subRoot' })],
      slots: {
        subItem: 'py-2',
        subRoot: 'shadow-sm'
      },
      variants: {
        tone: {
          primary: {
            subItem: 'uppercase',
            subRoot: 'border'
          }
        }
      }
    });

    expect(listB()).toEqual({
      subItem: 'px-2 text-white font-medium py-2 uppercase',
      subRoot: 'rounded-md bg-slate-900 shadow-sm border'
    });
  });

  it('supports multi-extend with scv, cv and mapped cv sources while preserving ordering', () => {
    const button = cv({
      base: 'rounded-md px-2',
      defaultVariants: {
        size: 'sm'
      },
      variants: {
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        }
      }
    });

    const surface = scv({
      slots: {
        body: 'text-slate-700',
        root: 'bg-red-500 p-2'
      },
      variants: {
        tone: {
          primary: {
            root: 'text-white'
          }
        }
      }
    });

    const accent = scv({
      slots: {
        footer: 'border-t',
        root: 'bg-green-500 px-4'
      },
      variants: {
        tone: {
          primary: {
            footer: 'text-emerald-700'
          }
        }
      }
    });

    const layered = scv({
      defaultVariants: {
        tone: 'primary'
      },
      extend: [surface, accent]
    });

    const layeredResult = layered();

    expect(layeredResult.root).toContain('bg-red-500');
    expect(layeredResult.root).toContain('bg-green-500');
    expect(layeredResult.root).toContain('text-white');

    const card = scv({
      extend: [surface, accent],
      extendBase: () => ({
        root: button(),
        footer: button()
      }),
      slots: {
        footer: 'py-2',
        root: 'px-6'
      },
      defaultVariants: {
        tone: 'primary'
      },
      variants: {
        tone: {
          primary: {
            root: 'bg-blue-500'
          }
        }
      }
    });

    const result = card();

    expect(result.body).toBe('text-slate-700');
    expect(result.footer).toBe('border-t text-emerald-700 rounded-md px-2 text-sm py-2');
    expect(result.root).toContain('rounded-md');
    expect(result.root).toContain('text-sm');
    expect(result.root).toContain('text-white');
    expect(result.root).toContain('bg-blue-500');
    expect(result.root).toContain('px-6');
    expect(result.root).toContain('bg-red-500');
    expect(result.root).toContain('bg-green-500');
    expect(result.root).not.toContain('text-lg');
  });

  it('skips inherited class names for slots listed in extendIgnore', () => {
    const base = scv({
      slots: {
        body: 'p-2 text-sm',
        root: 'rounded-md bg-slate-900'
      },
      variants: {
        tone: {
          primary: {
            body: 'text-white',
            root: 'ring-1'
          }
        }
      }
    });

    const card = scv({
      extend: [base],
      extendIgnore: ['body'],
      slots: {
        body: 'm-2',
        root: 'shadow-sm'
      },
      defaultVariants: {
        tone: 'primary'
      }
    });

    expect(card()).toEqual({
      body: 'm-2',
      root: 'rounded-md bg-slate-900 ring-1 shadow-sm'
    });
  });

  it('does not leak ignored inherited slot class names through further extensions', () => {
    const base = scv({
      slots: {
        popup: 'base-popup',
        root: 'base-root'
      }
    });

    const drawer = scv({
      extend: [base],
      extendIgnore: ['popup'],
      slots: {
        popup: 'drawer-popup',
        root: 'drawer-root'
      }
    });

    const bottomSheet = scv({
      extend: [drawer],
      slots: {
        popup: 'sheet-popup'
      }
    });

    expect(drawer()).toEqual({
      popup: 'drawer-popup',
      root: 'base-root drawer-root'
    });

    expect(bottomSheet()).toEqual({
      popup: 'drawer-popup sheet-popup',
      root: 'base-root drawer-root'
    });
  });

  it('lets local defaultVariants override inherited defaults', () => {
    const button = cv({
      base: 'rounded-md',
      defaultVariants: {
        size: 'sm'
      },
      variants: {
        size: {
          lg: 'text-lg',
          sm: 'text-sm'
        }
      }
    });

    const card = scv({
      extendBase: () => ({
        root: button()
      }),
      defaultVariants: {
        size: 'lg'
      }
    });

    expect(card()).toEqual({
      root: 'rounded-md text-lg'
    });
  });
});
