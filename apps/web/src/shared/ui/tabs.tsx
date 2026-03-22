'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../lib/cn';

export const Tabs = TabsPrimitive.Root;
export const TabsList = TabsPrimitive.List;
export const TabsTrigger = TabsPrimitive.Trigger;
export const TabsContent = TabsPrimitive.Content;

export function TabsListBase({
  className,
  ...props
}: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex rounded-full bg-slate-100 p-1', className)}
      {...props}
    />
  );
}

export function TabsTriggerBase({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function TabsContentBase({
  className,
  ...props
}: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />;
}
