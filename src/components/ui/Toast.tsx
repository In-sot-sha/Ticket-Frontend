import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';

// Toast variants using class-variance-authority
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  action?: React.ReactNode;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, open = true, onOpenChange, duration = 4000, action, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(open);

    useEffect(() => {
      setIsVisible(open);
    }, [open]);

    // Auto-dismiss toast after duration
    useEffect(() => {
      if (isVisible && duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onOpenChange) {
            onOpenChange(false);
          }
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [isVisible, duration, onOpenChange]);

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex flex-1">
          <div className="flex-1">{props.children}</div>
          {action}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onOpenChange) {
              onOpenChange(false);
            }
          }}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Toast, toastVariants };

// Toast provider and hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }>>([]);

  const toast = ({
    title,
    description,
    variant = 'default',
    duration
  }: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      title,
      description,
      variant,
      duration
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after its duration + some extra time for animation
    if (duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, (duration || 4000) + 300);
    }

    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toast,
    dismiss,
    toasts
  };
};

// Toast viewport component to render all toasts
interface ToastViewportProps {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }>;
  dismiss: (id: string) => void;
}

export const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, dismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col gap-2">
      {toasts.map(({ id, title, description, variant, duration }) => (
        <Toast
          key={id}
          variant={variant}
          duration={duration}
          onOpenChange={() => dismiss(id)}
        >
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </Toast>
      ))}
    </div>
  );
};