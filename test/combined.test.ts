import { describe, expect, it } from 'vitest';
import { cv, defaults, scv } from '../src';

describe('combined', () => {
  it('compiles and resolves correctly', () => {
    type ThemeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

    const miniSizeMap: Record<ThemeSize, ThemeSize> = {
      xs: 'xs',
      sm: 'xs',
      md: 'sm',
      lg: 'md',
      xl: 'lg',
      '2xl': 'xl'
    };

    const buttonVariants = cv({
      base: [
        'inline-flex items-center justify-center font-medium transition-all-150',
        'outline-none focus-visible:ring-3 focus-visible:ring-offset-background',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
      ],
      variants: {
        color: {
          primary: `focus-visible:ring-primary/30`,
          destructive: `focus-visible:ring-destructive/30`,
          success: `focus-visible:ring-success/30`,
          warning: `focus-visible:ring-warning/30`,
          info: `focus-visible:ring-info/30`,
          carbon: `focus-visible:ring-carbon/30`,
          secondary: `focus-visible:ring-secondary-foreground/20`,
          accent: `focus-visible:ring-accent-foreground/20`
        },
        variant: {
          solid: 'bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary-600',
          pure: 'border border-border bg-background text-accent-foreground hover:bg-accent/60 active:bg-accent',
          plain: 'border border-border bg-background text-foreground',
          outline: 'border bg-background',
          dashed: 'border border-dashed bg-background',
          soft: 'bg-primary/10 hover:bg-primary/10 active:bg-primary/20',
          ghost: 'bg-transparent',
          link: 'bg-transparent underline-offset-4 hover:underline'
        },
        size: {
          xs: 'gap-1 text-2xs',
          sm: 'gap-2 text-xs',
          md: 'gap-3 text-sm',
          lg: 'gap-4 text-base',
          xl: 'gap-5 text-lg',
          '2xl': 'gap-6 text-xl'
        },
        shape: {
          auto: 'rounded-md',
          rounded: 'rounded-full',
          square: 'h-8 w-8 p-0 gap-0 rounded-md',
          circle: 'h-8 w-8 p-0 gap-0 rounded-full'
        },
        shadow: {
          none: 'shadow-none',
          sm: 'shadow-sm',
          md: 'shadow-md',
          lg: 'shadow-lg'
        },
        fitContent: {
          true: 'w-fit h-fit',
          false: ''
        }
      },
      compoundVariants: [
        {
          color: 'destructive',
          variant: 'solid',
          class: `bg-destructive text-destructive-foreground hover:bg-destructive/80 active:bg-destructive-600`
        },
        {
          color: 'success',
          variant: 'solid',
          class: `bg-success text-success-foreground hover:bg-success/80 active:bg-success-600`
        },
        {
          color: 'warning',
          variant: 'solid',
          class: `bg-warning text-warning-foreground hover:bg-warning/80 active:bg-warning-600`
        },
        {
          color: 'info',
          variant: 'solid',
          class: `bg-info text-info-foreground hover:bg-info/80 active:bg-info-600`
        },
        {
          color: 'carbon',
          variant: 'solid',
          class: `bg-carbon text-carbon-foreground hover:bg-carbon/80 active:bg-carbon-600`
        },
        {
          color: 'secondary',
          variant: 'solid',
          class: `bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary-foreground/20`
        },
        {
          color: 'accent',
          variant: 'solid',
          class: `bg-accent text-accent-foreground hover:bg-accent/80 active:bg-accent-foreground/20`
        },
        {
          color: 'primary',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-primary'
        },
        {
          color: 'destructive',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-destructive'
        },
        {
          color: 'success',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-success'
        },
        {
          color: 'warning',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-warning'
        },
        {
          color: 'info',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-info'
        },
        {
          color: 'carbon',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-carbon'
        },
        {
          color: 'secondary',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-secondary-foreground'
        },
        {
          color: 'accent',
          variant: ['outline', 'dashed', 'soft', 'ghost', 'link'],
          class: 'text-accent-foreground'
        },
        {
          color: 'primary',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-primary/10 active:bg-primary/20'
        },
        {
          color: 'destructive',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-destructive/10 active:bg-destructive/20'
        },
        {
          color: 'success',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-success/10 active:bg-success/20'
        },
        {
          color: 'warning',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-warning/10 active:bg-warning/20'
        },
        {
          color: 'info',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-info/10 active:bg-info/20'
        },
        {
          color: 'carbon',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-carbon/10 active:bg-carbon/20'
        },
        {
          color: 'secondary',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-secondary-foreground/10 active:bg-secondary-foreground/20'
        },
        {
          color: 'accent',
          variant: ['outline', 'dashed', 'ghost'],
          class: 'hover:bg-accent-foreground/10 active:bg-accent-foreground/20'
        },
        {
          color: 'primary',
          variant: 'plain',
          class: 'hover:border-primary hover:text-primary'
        },
        {
          color: 'destructive',
          variant: 'plain',
          class: 'hover:border-destructive hover:text-destructive'
        },
        {
          color: 'success',
          variant: 'plain',
          class: 'hover:border-success hover:text-success'
        },
        {
          color: 'warning',
          variant: 'plain',
          class: 'hover:border-warning hover:text-warning'
        },
        {
          color: 'info',
          variant: 'plain',
          class: 'hover:border-info hover:text-info'
        },
        {
          color: 'carbon',
          variant: 'plain',
          class: 'hover:border-carbon hover:text-carbon'
        },
        {
          color: 'secondary',
          variant: 'plain',
          class: 'hover:border-secondary-foreground hover:text-secondary-foreground'
        },
        {
          color: 'accent',
          variant: 'plain',
          class: 'hover:border-accent-foreground hover:text-accent-foreground'
        },
        {
          color: 'primary',
          variant: ['outline', 'dashed'],
          class: 'border-primary'
        },
        {
          color: 'destructive',
          variant: ['outline', 'dashed'],
          class: 'border-destructive'
        },
        {
          color: 'success',
          variant: ['outline', 'dashed'],
          class: 'border-success'
        },
        {
          color: 'warning',
          variant: ['outline', 'dashed'],
          class: 'border-warning'
        },
        {
          color: 'info',
          variant: ['outline', 'dashed'],
          class: 'border-info'
        },
        {
          color: 'carbon',
          variant: ['outline', 'dashed'],
          class: 'border-carbon'
        },
        {
          color: 'secondary',
          variant: ['outline', 'dashed'],
          class: 'border-secondary-foreground'
        },
        {
          color: 'accent',
          variant: ['outline', 'dashed'],
          class: 'border-accent-foreground'
        },
        {
          color: 'destructive',
          variant: 'soft',
          class: 'bg-destructive/10 hover:bg-destructive/10 active:bg-destructive/20'
        },
        {
          color: 'success',
          variant: 'soft',
          class: 'bg-success/10 hover:bg-success/10 active:bg-success/20'
        },
        {
          color: 'warning',
          variant: 'soft',
          class: 'bg-warning/10 hover:bg-warning/10 active:bg-warning/20'
        },
        {
          color: 'info',
          variant: 'soft',
          class: 'bg-info/10 hover:bg-info/10 active:bg-info/20'
        },
        {
          color: 'carbon',
          variant: 'soft',
          class: 'bg-carbon/10 hover:bg-carbon/10 active:bg-carbon/20'
        },
        {
          color: 'secondary',
          variant: 'soft',
          class: 'bg-secondary-foreground/10 hover:bg-secondary-foreground/10 active:bg-secondary-foreground/20'
        },
        {
          color: 'accent',
          variant: 'soft',
          class: 'bg-accent-foreground/10 hover:bg-accent-foreground/10 active:bg-accent-foreground/20'
        },
        {
          size: 'xs',
          fitContent: true,
          class: 'p-0.75'
        },
        {
          size: 'sm',
          fitContent: true,
          class: 'p-0.875'
        },
        {
          size: 'md',
          fitContent: true,
          class: 'p-1'
        },
        {
          size: 'lg',
          fitContent: true,
          class: 'p-1.25'
        },
        {
          size: 'xl',
          fitContent: true,
          class: 'p-1.5'
        },
        {
          size: '2xl',
          fitContent: true,
          class: 'p-1.75'
        },
        {
          size: 'xs',
          fitContent: false,
          class: 'h-6 px-1.5'
        },
        {
          size: 'sm',
          fitContent: false,
          class: 'h-7 px-2'
        },
        {
          size: 'md',
          fitContent: false,
          class: 'h-8 px-4'
        },
        {
          size: 'lg',
          fitContent: false,
          class: 'h-9 px-6'
        },
        {
          size: 'xl',
          fitContent: false,
          class: 'h-10 px-8'
        },
        {
          size: '2xl',
          fitContent: false,
          class: 'h-12 px-10'
        },
        {
          size: 'xs',
          fitContent: false,
          shape: ['square', 'circle'],
          class: 'w-6'
        },
        {
          size: 'sm',
          fitContent: false,
          shape: ['square', 'circle'],
          class: 'w-7'
        },
        {
          size: 'lg',
          fitContent: false,
          shape: ['square', 'circle'],
          class: 'w-9'
        },
        {
          size: 'xl',
          fitContent: false,
          shape: ['square', 'circle'],
          class: 'w-10'
        },
        {
          size: '2xl',
          fitContent: false,
          shape: ['square', 'circle'],
          class: 'w-12'
        },
        {
          variant: ['ghost', 'link'],
          shadow: ['sm', 'md', 'lg'],
          class: 'shadow-none'
        },
        {
          variant: 'plain',
          shadow: 'sm',
          class: 'active:shadow-md'
        },
        {
          variant: 'plain',
          shadow: 'md',
          class: 'active:shadow-lg'
        },
        {
          variant: 'plain',
          shadow: 'lg',
          class: 'active:shadow-xl'
        },
        {
          variant: 'pure',
          shadow: 'sm',
          class: 'active:shadow-sm'
        },
        {
          variant: 'pure',
          shadow: 'md',
          class: 'active:shadow-md'
        },
        {
          variant: 'pure',
          shadow: 'lg',
          class: 'active:shadow-lg'
        }
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
        shape: 'auto',
        shadow: 'sm',
        fitContent: false
      }
    });

    const buttonIconVariants = defaults(buttonVariants, {
      size: 'md',
      color: 'accent',
      variant: 'ghost',
      shape: 'square',
      fitContent: true
    });

    const dialogVariants = scv({
      extendBase: props => {
        const miniSize = props.size ? miniSizeMap[props.size as ThemeSize] : 'md';

        return {
          close: buttonIconVariants({ size: miniSize }),
          cancel: buttonVariants({ size: miniSize, variant: 'pure' }),
          confirm: buttonVariants({ size: miniSize })
        };
      },
      slots: {
        overlay: [
          `fixed inset-0 z-50 bg-black/80`,
          `data-[state=open]:animate-in data-[state=open]:fade-in-0`,
          `data-[state=closed]:animate-out data-[state=closed]:fade-out-0`
        ],
        popup: [
          `group fixed start-1/2 top-1/2 z-50 flex flex-col w-max lt-sm:min-w-full lt-sm:max-w-full border bg-background shadow-lg outline-none duration-200 rounded-lg`,
          `-translate-x-1/2 -translate-y-1/2 [&[dir=rtl]]:translate-x-1/2`,
          `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2`,
          `data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2`
        ],
        header: `flex flex-col text-center sm:text-start`,
        title: `flex items-center font-semibold leading-none tracking-tight m-0`,
        icon: 'group-data-[type=info]:text-info group-data-[type=success]:text-success group-data-[type=warning]:text-warning group-data-[type=error]:text-destructive',
        description: `text-muted-foreground m-0`,
        close: `absolute`,
        content: `grow overflow-auto`,
        footer: `flex flex-col-reverse sm:flex-row sm:justify-end`,
        cancel: '',
        confirm: ''
      },
      variants: {
        size: {
          xs: {
            popup: `gap-y-1.5 min-w-xs max-w-3xl px-2 py-1.5 text-2xs`,
            header: 'gap-y-1.5',
            title: 'gap-x-1.5 text-xs',
            description: 'text-2xs',
            close: 'end-1.5 top-1.5',
            footer: 'gap-1.5'
          },
          sm: {
            popup: `gap-y-2 min-w-sm max-w-4xl px-3 py-2 text-xs`,
            header: 'gap-y-2',
            title: 'gap-x-1.75 text-sm',
            description: 'text-xs',
            close: 'end-1.75 top-1.75',
            footer: 'gap-2'
          },
          md: {
            popup: `gap-y-3 min-w-md max-w-5xl px-4 py-3 text-sm`,
            header: 'gap-y-3',
            title: 'gap-x-2 text-base',
            description: 'text-sm',
            close: 'end-2 top-2',
            footer: 'gap-3'
          },
          lg: {
            popup: `gap-y-4 min-w-lg max-w-6xl px-5 py-4 text-base`,
            header: 'gap-y-4',
            title: 'gap-x-2.5 text-lg',
            description: 'text-base',
            close: 'end-2.5 top-2.5',
            footer: 'gap-4'
          },
          xl: {
            popup: `gap-y-5 min-w-xl max-w-7xl px-6 py-5 text-lg`,
            header: 'gap-y-5',
            title: 'gap-x-3 text-xl',
            description: 'text-lg',
            close: 'end-3 top-3',
            footer: 'gap-5'
          },
          '2xl': {
            popup: `gap-y-6 min-w-2xl max-w-7xl px-7 py-6 text-xl`,
            header: 'gap-y-6',
            title: 'gap-x-3.5 text-2xl',
            description: 'text-xl',
            close: 'end-4 top-4',
            footer: 'gap-6'
          }
        },
        pure: {
          true: {
            popup: 'p-0 gap-0 border-none'
          }
        }
      },
      defaultVariants: {
        size: 'md'
      }
    });

    const result = dialogVariants({ size: 'lg', pure: true });

    expect(result.overlay).toBe(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
    );
    expect(result.popup).toBe(
      'group fixed start-1/2 top-1/2 z-50 flex flex-col w-max lt-sm:min-w-full lt-sm:max-w-full border bg-background shadow-lg outline-none duration-200 rounded-lg -translate-x-1/2 -translate-y-1/2 [&[dir=rtl]]:translate-x-1/2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 gap-y-4 min-w-lg max-w-6xl px-5 py-4 text-base p-0 gap-0 border-none'
    );
    expect(result.header).toBe('flex flex-col text-center sm:text-start gap-y-4');
    expect(result.title).toBe('flex items-center font-semibold leading-none tracking-tight m-0 gap-x-2.5 text-lg');
    expect(result.description).toBe('text-muted-foreground m-0 text-base');
    expect(result.close).toBe(
      'inline-flex items-center justify-center font-medium transition-all-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-background data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 focus-visible:ring-accent-foreground/20 bg-transparent gap-3 text-sm h-8 w-8 p-0 gap-0 rounded-md shadow-sm w-fit h-fit text-accent-foreground hover:bg-accent-foreground/10 active:bg-accent-foreground/20 p-1 shadow-none absolute end-2.5 top-2.5'
    );
    expect(result.content).toBe('grow overflow-auto');
    expect(result.footer).toBe('flex flex-col-reverse sm:flex-row sm:justify-end gap-4');
    expect(result.cancel).toBe(
      'inline-flex items-center justify-center font-medium transition-all-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-background data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 focus-visible:ring-primary/30 border border-border bg-background text-accent-foreground hover:bg-accent/60 active:bg-accent gap-3 text-sm rounded-md shadow-sm h-8 px-4 active:shadow-sm'
    );
    expect(result.confirm).toBe(
      'inline-flex items-center justify-center font-medium transition-all-150 outline-none focus-visible:ring-3 focus-visible:ring-offset-background data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 focus-visible:ring-primary/30 bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary-600 gap-3 text-sm rounded-md shadow-sm h-8 px-4'
    );
  });
});
