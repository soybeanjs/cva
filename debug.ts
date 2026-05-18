import { cv, defaults, derive, scv } from './src';

export type ThemeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const miniSizeMap: Record<ThemeSize, ThemeSize> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
  '2xl': 'xl'
};

export const buttonVariants = cv({
  base: ['inline-flex items-center justify-center'],
  variants: {
    size: {
      xs: 'gap-1 text-2xs',
      sm: 'gap-2 text-xs',
      md: 'gap-3 text-sm',
      lg: 'gap-4 text-base',
      xl: 'gap-5 text-lg',
      '2xl': 'gap-6 text-xl'
    },
    fitContent: {
      true: 'w-fit h-fit',
      false: ''
    }
  },
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    shape: 'auto',
    shadow: 'sm',
    fitContent: false
  }
});

export const iconButtonVariants = defaults(buttonVariants, {
  fitContent: true
});

export const miniIconButtonVariants = derive(iconButtonVariants, props => ({
  size: miniSizeMap[props.size ?? 'md']
}));

const cardVariants = scv({
  extend: [
    {
      close: miniIconButtonVariants
    }
  ],
  slots: {
    root: 'rounded-lg border p-4',
    close: ''
  },
  defaultVariants: {
    size: 'md'
  }
});

console.log('cardVariants(): ', cardVariants());
