import { bench, describe } from 'vitest';

import {
  cssVariantsScvBaseOnly,
  cssVariantsScvComplexCard,
  cssVariantsScvCompoundVariants,
  cssVariantsScvMultipleVariants,
  cssVariantsScvNoVariants,
  cssVariantsScvSingleVariant,
  cssVariantsScvWithDefaults
} from './shared/css-variants-scv';
import {
  currentScvBaseOnly,
  currentScvComplexCard,
  currentScvCompoundVariants,
  currentScvMultipleVariants,
  currentScvNoVariants,
  currentScvSingleVariant,
  currentScvWithDefaults
} from './shared/current-scv';
import {
  tvSlotsBaseOnly,
  tvSlotsComplexCard,
  tvSlotsCompoundVariants,
  tvSlotsMultipleVariants,
  tvSlotsNoVariants,
  tvSlotsSingleVariant,
  tvSlotsWithDefaults
} from './shared/tv-slots';

describe('@soybeanjs/cva scv comparison', () => {
  describe('basic', () => {
    bench('@soybeanjs/cva: base slots only', () => {
      currentScvBaseOnly();
    });

    bench('css-variants: base slots only', () => {
      cssVariantsScvBaseOnly();
    });

    bench('tailwind-variants: base slots only', () => {
      const { content, root } = tvSlotsBaseOnly();
      root();
      content();
    });

    bench('@soybeanjs/cva: single variant', () => {
      currentScvSingleVariant({ color: 'primary' });
    });

    bench('css-variants: single variant', () => {
      cssVariantsScvSingleVariant({ color: 'primary' });
    });

    bench('tailwind-variants: single variant', () => {
      const { icon, root } = tvSlotsSingleVariant({ color: 'primary' });
      root();
      icon();
    });

    bench('@soybeanjs/cva: multiple variants', () => {
      currentScvMultipleVariants({ size: 'md', variant: 'info' });
    });

    bench('css-variants: multiple variants', () => {
      cssVariantsScvMultipleVariants({ size: 'md', variant: 'info' });
    });

    bench('tailwind-variants: multiple variants', () => {
      const { description, icon, root, title } = tvSlotsMultipleVariants({ size: 'md', variant: 'info' });
      root();
      title();
      description();
      icon();
    });

    bench('@soybeanjs/cva: no variants with merges', () => {
      currentScvNoVariants(undefined, { root: ['extra'] });
    });

    bench('css-variants: no variants with classNames', () => {
      cssVariantsScvNoVariants({ classNames: { root: 'extra' } });
    });

    bench('tailwind-variants: no variants with class', () => {
      const { content, root } = tvSlotsNoVariants({ class: 'extra' });
      root();
      content();
    });
  });

  describe('defaults', () => {
    bench('@soybeanjs/cva', () => {
      currentScvWithDefaults();
    });

    bench('css-variants', () => {
      cssVariantsScvWithDefaults();
    });

    bench('tailwind-variants', () => {
      const { input, label, root } = tvSlotsWithDefaults();
      root();
      label();
      input();
    });
  });

  describe('compound variants', () => {
    bench('@soybeanjs/cva', () => {
      currentScvCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
    });

    bench('css-variants', () => {
      cssVariantsScvCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
    });

    bench('tailwind-variants', () => {
      const { content, icon, root } = tvSlotsCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
      root();
      content();
      icon();
    });
  });

  describe('complex real-world component', () => {
    bench('@soybeanjs/cva', () => {
      currentScvComplexCard({ hoverable: true, size: 'lg', variant: 'elevated' });
    });

    bench('css-variants', () => {
      cssVariantsScvComplexCard({ hoverable: true, size: 'lg', variant: 'elevated' });
    });

    bench('tailwind-variants', () => {
      const { actions, content, description, footer, header, root, title } = tvSlotsComplexCard({
        hoverable: true,
        size: 'lg',
        variant: 'elevated'
      });
      root();
      header();
      title();
      description();
      content();
      footer();
      actions();
    });
  });
});
