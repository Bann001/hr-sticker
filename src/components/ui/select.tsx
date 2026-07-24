import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-10 px-3.5 text-sm bg-bg-surface border border-border rounded-xl text-text-primary',
            'transition-all duration-150 ease-out',
            'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
            'disabled:opacity-40 disabled:pointer-events-none',
            'appearance-none bg-[length:16px] bg-no-repeat bg-[right_12px_center]',
            className,
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          }}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  },
);

Select.displayName = 'Select';
export { Select, type SelectProps };