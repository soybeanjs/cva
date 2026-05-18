import { bench, describe } from 'vitest';

import {
  cssVariantsCvBaseOnly,
  cssVariantsCvComplexButton,
  cssVariantsCvCompoundVariants,
  cssVariantsCvMultipleVariants,
  cssVariantsCvNoVariants,
  cssVariantsCvSingleVariant,
  cssVariantsCvWithDefaults
} from './shared/css-variants-cv';
import {
  currentCvBaseOnly,
  currentCvComplexButton,
  currentCvCompoundVariants,
  currentCvMultipleVariants,
  currentCvNoVariants,
  currentCvSingleVariant,
  currentCvWithDefaults
} from './shared/current-cv';
import {
  cvaBaseOnly,
  cvaComplexButton,
  cvaCompoundVariants,
  cvaMultipleVariants,
  cvaNoVariants,
  cvaSingleVariant,
  cvaWithDefaults
} from './shared/cva';

describe('@soybeanjs/cva cv comparison', () => {
  describe('basic', () => {
    bench('@soybeanjs/cva: base class only', () => {
      currentCvBaseOnly();
    });

    bench('css-variants: base class only', () => {
      cssVariantsCvBaseOnly();
    });

    bench('class-variance-authority: base class only', () => {
      cvaBaseOnly();
    });

    bench('@soybeanjs/cva: single variant', () => {
      currentCvSingleVariant({ color: 'primary' });
    });

    bench('css-variants: single variant', () => {
      cssVariantsCvSingleVariant({ color: 'primary' });
    });

    bench('class-variance-authority: single variant', () => {
      cvaSingleVariant({ color: 'primary' });
    });

    bench('@soybeanjs/cva: multiple variants', () => {
      currentCvMultipleVariants({ color: 'primary', size: 'md', variant: 'solid' });
    });

    bench('css-variants: multiple variants', () => {
      cssVariantsCvMultipleVariants({ color: 'primary', size: 'md', variant: 'solid' });
    });

    bench('class-variance-authority: multiple variants', () => {
      cvaMultipleVariants({ color: 'primary', size: 'md', variant: 'solid' });
    });

    bench('@soybeanjs/cva: no variants with merges', () => {
      currentCvNoVariants(undefined, 'extra');
    });

    bench('css-variants: no variants with className', () => {
      cssVariantsCvNoVariants({ className: 'extra' });
    });

    bench('class-variance-authority: no variants with className', () => {
      cvaNoVariants({ className: 'extra' });
    });
  });

  describe('defaults', () => {
    bench('@soybeanjs/cva', () => {
      currentCvWithDefaults();
    });

    bench('css-variants', () => {
      cssVariantsCvWithDefaults();
    });

    bench('class-variance-authority', () => {
      cvaWithDefaults();
    });
  });

  describe('compound variants', () => {
    bench('@soybeanjs/cva', () => {
      currentCvCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
    });

    bench('css-variants', () => {
      cssVariantsCvCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
    });

    bench('class-variance-authority', () => {
      cvaCompoundVariants({ color: 'primary', disabled: true, size: 'lg' });
    });
  });

  describe('complex real-world component', () => {
    bench('@soybeanjs/cva', () => {
      currentCvComplexButton({ size: 'lg', variant: 'destructive' });
    });

    bench('css-variants', () => {
      cssVariantsCvComplexButton({ size: 'lg', variant: 'destructive' });
    });

    bench('class-variance-authority', () => {
      cvaComplexButton({ size: 'lg', variant: 'destructive' });
    });
  });
});
