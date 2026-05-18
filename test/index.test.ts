import { describe, expect, it } from 'vitest';

import { aliasSlots, cv, scv } from '../src/index';
import type { VariantProps } from '../src/index';

type IsEqual<Left, Right> =
  (<Type>() => Type extends Left ? 1 : 2) extends <Type>() => Type extends Right ? 1 : 2 ? true : false;

type Assert<Type extends true> = Type;

describe('cv', () => {
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
          danger: 'bg-red-500',
          primary: 'bg-blue-500'
        }
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

  it('supports cv extension with inherited VariantProps and defaults', () => {
    const surface = cv({
      base: 'rounded-md',
      defaultVariants: {
        size: 'sm'
      },
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

    const button = cv({
      base: 'font-medium',
      compoundVariants: [
        {
          class: 'uppercase',
          intent: 'solid',
          size: 'sm'
        }
      ],
      defaultVariants: {
        tone: 'primary'
      },
      extend: [surface],
      variants: {
        intent: {
          solid: 'shadow-sm'
        }
      }
    });

    type ButtonProps = VariantProps<typeof button>;
    const buttonPropsAssertion: Assert<
      IsEqual<
        ButtonProps,
        {
          intent?: 'solid';
          size?: 'lg' | 'sm';
          tone?: 'primary' | 'secondary';
        }
      >
    > = true;

    expect(button({ intent: 'solid' })).toBe('rounded-md text-sm bg-blue-500 font-medium shadow-sm uppercase');
    expect(button({ intent: 'solid', size: 'lg', tone: 'secondary' })).toBe(
      'rounded-md text-lg bg-slate-200 font-medium shadow-sm'
    );
    expect(buttonPropsAssertion).toBe(true);
  });
});

describe('scv', () => {
  it('exposes VariantProps for scv results', () => {
    const card = scv({
      extend: [{ root: cv({ variants: { size: { lg: 'text-lg', sm: 'text-sm' } } }) }],
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

    expect(card(validProps).root).toBe('text-lg bg-blue-500');
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

  it('supports alias remapping inheritance across scv extensions', () => {
    const baseCard = scv({
      slots: {
        body: 'p-4',
        root: 'rounded-md'
      },
      compoundVariants: [
        {
          class: {
            root: 'ring-1'
          },
          tone: 'primary'
        }
      ],
      variants: {
        tone: {
          primary: {
            body: 'text-white',
            root: 'bg-slate-900'
          }
        }
      }
    });

    const sectionCard = scv({
      slots: {
        header: 'font-semibold'
      },
      compoundVariants: [
        {
          class: {
            body: 'tracking-wide'
          },
          tone: 'primary'
        }
      ],
      extend: [aliasSlots(baseCard, { root: 'header' })],
      variants: {
        tone: {
          primary: {
            header: 'uppercase'
          }
        }
      }
    });

    expect(sectionCard({ tone: 'primary' })).toEqual({
      body: 'p-4 text-white tracking-wide',
      header: 'rounded-md bg-slate-900 ring-1 font-semibold uppercase'
    });
  });

  it('maps inherited root and item slots to subRoot and subItem through aliases', () => {
    const listA = scv({
      slots: {
        item: 'px-2',
        root: 'rounded-md'
      },
      compoundVariants: [
        {
          class: {
            item: 'font-medium',
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
            item: 'text-white',
            root: 'bg-slate-900'
          }
        }
      }
    });

    const listB = scv({
      slots: {
        subItem: 'py-2',
        subRoot: 'shadow-sm'
      },
      extend: [aliasSlots(listA, { item: 'subItem', root: 'subRoot' })],
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
      subRoot: 'rounded-md bg-slate-900 ring-1 shadow-sm border'
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
      slots: {
        footer: 'py-2',
        root: 'px-6'
      },
      defaultVariants: {
        size: 'lg',
        tone: 'primary'
      },
      extend: [surface, accent, { root: button }, { footer: button }],
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
    expect(result.footer).toBe('border-t text-emerald-700 rounded-md px-2 text-lg py-2');
    expect(result.root).toContain('rounded-md');
    expect(result.root).toContain('text-lg');
    expect(result.root).toContain('text-white');
    expect(result.root).toContain('bg-blue-500');
    expect(result.root).toContain('px-6');
    expect(result.root).toContain('bg-red-500');
    expect(result.root).toContain('bg-green-500');
    expect(result.root).not.toContain('text-sm');
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
      slots: {
        body: 'm-2',
        root: 'shadow-sm'
      },
      defaultVariants: {
        tone: 'primary'
      },
      extend: [base],
      extendIgnore: ['body']
    });

    expect(card()).toEqual({
      body: 'm-2',
      root: 'rounded-md bg-slate-900 ring-1 shadow-sm'
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
      defaultVariants: {
        size: 'lg'
      },
      extend: [{ root: button }]
    });

    expect(card()).toEqual({
      root: 'rounded-md text-lg'
    });
  });
});
