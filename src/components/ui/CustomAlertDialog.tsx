import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"

interface CustomAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({
  isOpen,
  onClose,
  title = 'Attention',
  description,
  onConfirm,
  confirmText = 'OK',
  cancelText,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelText && (
            <AlertDialogCancel onClick={onClose}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            // variant="default"
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
