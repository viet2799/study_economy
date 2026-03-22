'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '../lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  ...props
}: PopoverPrimitive.PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        className={cn(
          'z-50 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl outline-none',
          className
        )}
        sideOffset={8}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
