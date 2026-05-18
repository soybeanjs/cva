import { scv } from '../../src/index';

export const currentScvBaseOnly = scv({
  slots: {
    content: 'card-content',
    root: 'card'
  }
});

export const currentScvSingleVariant = scv({
  slots: {
    icon: 'btn-icon',
    root: 'btn'
  },
  variants: {
    color: {
      danger: {
        icon: 'text-red-100',
        root: 'bg-red-500 text-white'
      },
      primary: {
        icon: 'text-white',
        root: 'bg-blue-500 text-white'
      },
      secondary: {
        icon: 'text-white',
        root: 'bg-gray-500 text-white'
      }
    }
  }
});

export const currentScvMultipleVariants = scv({
  slots: {
    description: 'text-sm',
    icon: 'shrink-0',
    root: 'alert flex items-start gap-3 rounded-lg border p-4',
    title: 'font-semibold'
  },
  variants: {
    size: {
      md: {
        description: 'text-sm',
        icon: 'w-5 h-5',
        root: 'p-4',
        title: 'text-base'
      },
      sm: {
        description: 'text-xs',
        icon: 'w-4 h-4',
        root: 'p-3',
        title: 'text-sm'
      }
    },
    variant: {
      error: {
        description: 'text-red-700',
        icon: 'text-red-600',
        root: 'bg-red-50 border-red-200',
        title: 'text-red-900'
      },
      info: {
        description: 'text-blue-700',
        icon: 'text-blue-600',
        root: 'bg-blue-50 border-blue-200',
        title: 'text-blue-900'
      },
      success: {
        description: 'text-green-700',
        icon: 'text-green-600',
        root: 'bg-green-50 border-green-200',
        title: 'text-green-900'
      },
      warning: {
        description: 'text-yellow-700',
        icon: 'text-yellow-600',
        root: 'bg-yellow-50 border-yellow-200',
        title: 'text-yellow-900'
      }
    }
  }
});

export const currentScvWithDefaults = scv({
  defaultVariants: {
    size: 'md',
    variant: 'outlined'
  },
  slots: {
    input: 'form-input',
    label: 'form-label',
    root: 'form-field'
  },
  variants: {
    size: {
      lg: {
        input: 'px-4 py-3 text-lg',
        label: 'text-base'
      },
      md: {
        input: 'px-3 py-2 text-base',
        label: 'text-sm'
      },
      sm: {
        input: 'px-2 py-1 text-sm',
        label: 'text-xs'
      }
    },
    variant: {
      filled: {
        input: 'bg-gray-100 border-0 rounded'
      },
      outlined: {
        input: 'border-2 rounded'
      }
    }
  }
});

export const currentScvCompoundVariants = scv({
  compoundVariants: [
    {
      class: {
        content: 'tracking-wide',
        root: 'font-bold shadow-lg'
      },
      color: 'primary',
      size: 'lg'
    },
    {
      class: {
        root: 'font-semibold'
      },
      color: 'danger',
      size: ['sm', 'md']
    },
    {
      class: {
        root: 'pointer-events-none'
      },
      color: ['primary', 'secondary', 'danger'],
      disabled: true
    }
  ],
  slots: {
    content: 'btn-content',
    icon: 'btn-icon',
    root: 'btn inline-flex items-center gap-2 rounded transition'
  },
  variants: {
    color: {
      danger: {
        icon: 'text-white',
        root: 'bg-red-500 text-white hover:bg-red-600'
      },
      primary: {
        icon: 'text-white',
        root: 'bg-blue-500 text-white hover:bg-blue-600'
      },
      secondary: {
        icon: 'text-white',
        root: 'bg-gray-500 text-white hover:bg-gray-600'
      }
    },
    disabled: {
      false: {
        root: 'cursor-pointer'
      },
      true: {
        root: 'opacity-50 cursor-not-allowed'
      }
    },
    size: {
      lg: {
        content: 'text-lg',
        icon: 'w-5 h-5',
        root: 'px-6 py-3'
      },
      md: {
        content: 'text-base',
        icon: 'w-4 h-4',
        root: 'px-4 py-2'
      },
      sm: {
        content: 'text-sm',
        icon: 'w-3 h-3',
        root: 'px-2 py-1'
      }
    }
  }
});

export const currentScvComplexCard = scv({
  compoundVariants: [
    {
      class: {
        root: 'hover:shadow-xl hover:-translate-y-1'
      },
      hoverable: true,
      variant: 'elevated'
    }
  ],
  defaultVariants: {
    size: 'md',
    variant: 'default'
  },
  slots: {
    actions: 'card-actions flex gap-2',
    content: 'card-content p-6 pt-0',
    description: 'card-description text-sm text-gray-500',
    footer: 'card-footer flex items-center p-6 pt-0',
    header: 'card-header space-y-1.5 p-6',
    root: 'card relative rounded-lg border bg-white shadow-sm transition-shadow',
    title: 'card-title text-2xl font-semibold leading-none tracking-tight'
  },
  variants: {
    hoverable: {
      true: {
        root: 'hover:shadow-md cursor-pointer'
      }
    },
    size: {
      lg: {
        content: 'p-8 pt-0',
        footer: 'p-8 pt-0',
        header: 'p-8',
        root: 'max-w-2xl',
        title: 'text-3xl'
      },
      md: {
        root: 'max-w-md'
      },
      sm: {
        content: 'p-4 pt-0',
        description: 'text-xs',
        footer: 'p-4 pt-0',
        header: 'p-4',
        root: 'max-w-sm',
        title: 'text-lg'
      }
    },
    variant: {
      default: {
        root: 'border-gray-200'
      },
      elevated: {
        root: 'border-0 shadow-lg'
      },
      outlined: {
        root: 'border-2 shadow-none'
      }
    }
  }
});

export const currentScvNoVariants = scv({
  slots: {
    content: 'content',
    root: 'container'
  }
});
