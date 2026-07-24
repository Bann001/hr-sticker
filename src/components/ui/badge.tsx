import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full leading-none',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };