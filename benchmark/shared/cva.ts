import { cva } from 'class-variance-authority';

export const cvaBaseOnly = cva('base-class');

export const cvaSingleVariant = cva('btn', {
  variants: {
    color: {
      danger: 'bg-red-500 text-white',
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white'
    }
  }
});

export const cvaMultipleVariants = cva('btn rounded transition', {
  variants: {
    color: {
      danger: 'bg-red-500 text-white hover:bg-red-600',
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-500 text-white hover:bg-gray-600'
    },
    size: {
      lg: 'px-6 py-3 text-lg',
      md: 'px-4 py-2 text-base',
      sm: 'px-2 py-1 text-sm'
    },
    variant: {
      ghost: 'bg-transparent',
      outline: 'border-2 bg-transparent',
      solid: 'shadow-md'
    }
  }
});

export const cvaWithDefaults = cva('btn rounded transition', {
  defaultVariants: {
    color: 'primary',
    size: 'md'
  },
  variants: {
    color: {
      danger: 'bg-red-500 text-white hover:bg-red-600',
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-500 text-white hover:bg-gray-600'
    },
    size: {
      lg: 'px-6 py-3 text-lg',
      md: 'px-4 py-2 text-base',
      sm: 'px-2 py-1 text-sm'
    }
  }
});

export const cvaCompoundVariants = cva('btn rounded transition', {
  compoundVariants: [
    {
      className: 'font-bold shadow-lg',
      color: 'primary',
      size: 'lg'
    },
    {
      className: 'font-semibold',
      color: 'danger',
      size: ['sm', 'md']
    },
    {
      className: 'pointer-events-none',
      color: ['primary', 'secondary', 'danger'],
      disabled: true
    }
  ],
  variants: {
    color: {
      danger: 'bg-red-500 text-white',
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white'
    },
    disabled: {
      false: 'cursor-pointer',
      true: 'opacity-50 cursor-not-allowed'
    },
    size: {
      lg: 'px-6 py-3 text-lg',
      md: 'px-4 py-2 text-base',
      sm: 'px-2 py-1 text-sm'
    }
  }
});

export const cvaComplexButton = cva(
  [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  ],
  {
    compoundVariants: [
      {
        className: 'font-bold',
        size: 'lg',
        variant: 'destructive'
      },
      {
        className: 'font-normal',
        size: ['sm', 'default'],
        variant: ['outline', 'ghost']
      }
    ],
    defaultVariants: {
      size: 'default',
      variant: 'default'
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        icon: 'h-10 w-10',
        lg: 'h-11 rounded-md px-8',
        sm: 'h-9 rounded-md px-3'
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }
    }
  }
);

export const cvaNoVariants = cva('simple-class');
