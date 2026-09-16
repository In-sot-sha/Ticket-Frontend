import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  size?: number;
};

export function ResponsiveModal({ open, onOpenChange, children, size = 5 }: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent
          className={cn(
            // Kill default mt-24 gap; keep drawer flush to bottom with safe area.
            'mt-0 max-h-[min(92dvh,92vh)] p-0 gap-0 rounded-t-2xl border-neutral-200 dark:border-neutral-800',
            'pb-[env(safe-area-inset-bottom)]'
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          size == 5 ? 'lg:max-w-5xl' : size == 6 ? 'lg:max-w-6xl' : 'lg:max-w-3xl',
          'p-1 max-h-[90vh] overflow-y-auto'
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
