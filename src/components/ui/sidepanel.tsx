import { type ReactNode } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

type SidepanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string | ReactNode;
  children: ReactNode;
  className?: string;
  hideCloseButton?: boolean;
};

export function Sidepanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideCloseButton = false,
}: SidepanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-50 bg-black/20 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
        />
        <Dialog.Popup
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl",
            "transition-transform duration-300 ease-in-out",
            "data-[starting-style]:translate-x-full",
            "data-[ending-style]:translate-x-full",
            className
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex-1">
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-gray-500">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {!hideCloseButton && (
                <Dialog.Close className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}