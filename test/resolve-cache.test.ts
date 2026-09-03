import { afterEach, describe, expect, it, vi } from 'vitest';

// The resolve cache (see buildSelectionKey / setBounded) memoizes recipe output per
// selection vector. These tests pin down its contract: outputs must be identical
// whether a call hits the cache, populates it, or runs on a cold module.

async function withFreshModule<T>(run: (mod: typeof import('../src/index')) => T): Promise<T> {
  vi.resetModules();
  const mod = await import('../src/index');
  return run(mod);
}

describe('resolve cache', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('returns identical output regardless of cache order for cv', async () => {
    await withFreshModule(({ cv }) => {
      const button = cv({
        base: 'btn',
        compoundVariants: [
          { class: 'danger-lg', color: 'danger', size: 'lg' },
          { class: 'featured', featured: true } as never
        ],
        defaultVariants: { color: 'primary', size: 'md' },
        variants: {
          color: {
            danger: 'text-red-500',
            primary: 'text-blue-500',
            secondary: 'text-gray-500'
          },
          size: {
            lg: 'text-lg',
            md: 'text-md',
            sm: 'text-sm'
          }
        }
      });

      // Out-of-contract inputs (unknown keys, unlisted values) are rejected by types but
      // tolerated and ignored at runtime; the cache must respect that same contract.
      const combos: Record<string, unknown>[] = [
        {},
        { color: 'danger', size: 'lg' },
        { color: 'secondary' },
        { size: 'sm' },
        { featured: true },
        { featured: false },
        { color: 'danger' },
        { color: undefined, size: null },
        { color: 'brand', size: 'xl' },
        { unknownProp: 'ignored' }
      ];

      // warm the cache in forward order
      const warm = combos.map(combo => button(combo as never));
      // resolve again in reverse order through the populated cache
      const hot = [...combos].reverse().map(combo => button(combo as never)).reverse();
      // cold module: same combos against an empty cache
      const cold = [...combos].map(combo => button(combo as never));

      expect(hot).toEqual(warm);
      expect(cold).toEqual(warm);
      expect(warm[1]).toBe(button({ color: 'danger', size: 'lg' }));
      expect(warm[1]).toContain('danger-lg');
      expect(warm[4]).toContain('featured');
      expect(warm[5]).not.toContain('featured');
    });
  });

  it('matches compound conditions declared on non-variant props through the cache', async () => {
    await withFreshModule(({ cv }) => {
      // Runtime-only escape hatch (not expressible in the public types): a compound
      // condition may reference a prop outside `variants`. The resolve cache must keep
      // such keys in its selection key to stay correct.
      const badge = cv({
        base: 'badge',
        compoundVariants: [{ active: 'yes', class: 'is-active' }] as never,
        variants: {
          tone: { soft: 'bg-gray-100', strong: 'bg-gray-900' }
        }
      });

      expect(badge({ active: 'yes' } as never)).toContain('is-active');
      expect(badge({})).not.toContain('is-active');
      expect(badge({ active: false } as never)).not.toContain('is-active');
      expect(badge({ active: 'yes', tone: 'strong' } as never)).toContain('is-active');
    });
  });

  it('returns identical slot maps regardless of cache order for scv', async () => {
    await withFreshModule(({ scv }) => {
      const card = scv({
        slots: { body: 'p-2', root: 'rounded' },
        variants: {
          tone: {
            brand: { body: 'text-blue-500', root: 'bg-blue-50' },
            neutral: { body: 'text-gray-500', root: 'bg-white' }
          }
        }
      });

      const combos = [{}, { tone: 'brand' }, { tone: 'neutral' }, { tone: 'brand', extra: 1 }] as const;

      const warm = combos.map(combo => card(combo));
      const hot = [...combos].reverse().map(combo => card(combo)).reverse();
      const cold = combos.map(combo => card(combo));

      expect(hot).toEqual(warm);
      expect(cold).toEqual(warm);
    });
  });

  it('does not memoize recipes with extendBase so user code runs every call', async () => {
    await withFreshModule(({ cv }) => {
      let counter = 0;

      const recipe = cv({
        base: 'btn',
        extendBase: () => `count-${++counter}`
      });

      expect(recipe()).toBe('count-1 btn');
      expect(recipe()).toBe('count-2 btn');
      expect(recipe({})).not.toBe(recipe({}));
      expect(recipe()).toBe('count-5 btn');
    });
  });

  it('keeps merge overrides outside the memo path', async () => {
    await withFreshModule(({ cv }) => {
      const button = cv({
        base: 'px-2',
        variants: {
          size: { lg: 'text-lg', md: 'text-md' }
        }
      });

      expect(button({ size: 'lg' }, 'mt-4')).toBe('px-2 text-lg mt-4');
      expect(button({ size: 'lg' })).toBe('px-2 text-lg');
      expect(button({ size: 'lg' }, 'mt-4')).toBe('px-2 text-lg mt-4');
    });
  });
});
