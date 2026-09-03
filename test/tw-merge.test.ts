import { afterEach, describe, expect, it, vi } from 'vitest';

describe('merge engine integration', () => {
  afterEach(() => {
    vi.doUnmock('cn');
    vi.resetModules();
  });

  it('does not call the merge engine when merges are not provided', async () => {
    vi.resetModules();

    const mergeEngine = vi.fn((...args: unknown[]) => args.join(' '));

    vi.doMock('cn', async () => {
      const actual = await vi.importActual<typeof import('cn')>('cn');
      return { ...actual, cn: mergeEngine };
    });

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

    expect(mergeEngine).not.toHaveBeenCalled();

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

    expect(mergeEngine).not.toHaveBeenCalled();
  });

  it('calls the merge engine only when merges are provided', async () => {
    vi.resetModules();

    const mergeEngine = vi.fn((...args: unknown[]) => args.join(' '));

    vi.doMock('cn', async () => {
      const actual = await vi.importActual<typeof import('cn')>('cn');
      return { ...actual, cn: mergeEngine };
    });

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

    expect(mergeEngine).toHaveBeenCalledTimes(1);
    expect(mergeEngine).toHaveBeenNthCalledWith(1, 'px-2', 'text-lg', 'mt-4');

    mergeEngine.mockClear();

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

    expect(mergeEngine).toHaveBeenCalledTimes(2);
    expect(mergeEngine).toHaveBeenNthCalledWith(1, 'p-2', 'text-sm');
    expect(mergeEngine).toHaveBeenNthCalledWith(2, 'p-4', 'bg-blue-500', 'mt-2');
  });
});
