import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-accent text-selected-text hover:bg-accent-hover shadow-sm',
  primary: 'bg-accent text-selected-text hover:bg-accent-hover shadow-sm',
  secondary: 'bg-bg-surface text-text-primary hover:bg-border border border-border',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-surface',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
  outline: 'bg-transparent text-text-secondary border border-border hover:bg-bg-surface hover:text-text-primary',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-xl',
  default: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out cursor-pointer disabled:opacity-40 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
export { Button, type ButtonProps };