import { afterEach, describe, expect, it, vi } from 'vitest';

describe('tailwind-merge integration', () => {
  afterEach(() => {
    vi.doUnmock('tailwind-merge');
    vi.resetModules();
  });

  it('does not call tailwind-merge when merges are not provided', async () => {
    vi.resetModules();

    const twMerge = vi.fn((value: string) => value);

    vi.doMock('tailwind-merge', () => ({
      twMerge
    }));

    const { cv, scv } = await import('../src/index');

    const button = cv({
      base: 'px-2',
      variants: {
        size: {
          lg: 'text-lg'
        }
      }
    });

    button({ size: 'lg' });

    expect(twMerge).not.toHaveBeenCalled();

    const card = scv({
      slots: {
        body: 'p-2',
        root: 'p-4'
      },
      variants: {
        tone: {
          primary: {
            body: 'text-sm',
            root: 'bg-blue-500'
          }
        }
      }
    });

    card({ tone: 'primary' });

    expect(twMerge).not.toHaveBeenCalled();
  });

  it('calls tailwind-merge only when merges are provided', async () => {
    vi.resetModules();

    const twMerge = vi.fn((value: string) => value);

    vi.doMock('tailwind-merge', () => ({
      twMerge
    }));

    const { cv, scv } = await import('../src/index');

    const button = cv({
      base: 'px-2',
      variants: {
        size: {
          lg: 'text-lg'
        }
      }
    });

    button({ size: 'lg' }, 'mt-4');

    expect(twMerge).toHaveBeenCalledTimes(1);

    twMerge.mockClear();

    const card = scv({
      slots: {
        body: 'p-2',
        root: 'p-4'
      },
      variants: {
        tone: {
          primary: {
            body: 'text-sm',
            root: 'bg-blue-500'
          }
        }
      }
    });

    card({ tone: 'primary' }, { root: ['mt-2'] });

    expect(twMerge).toHaveBeenCalledTimes(2);
    expect(twMerge).toHaveBeenNthCalledWith(1, 'p-2 text-sm');
    expect(twMerge).toHaveBeenNthCalledWith(2, 'p-4 bg-blue-500 mt-2');
  });
});
