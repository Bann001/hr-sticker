import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted/60',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
            'disabled:opacity-40 disabled:pointer-events-none',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input, type InputProps };