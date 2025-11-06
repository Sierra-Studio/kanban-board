"use client";

import * as React from "react";
import { Toast } from "@base-ui-components/react/toast";

// Create a global toast manager instance
const toastManager = Toast.createToastManager();

// Type for our custom toast data
interface ToastData {
  id: string;
  description?: string;
  message?: string;
  type?: "success" | "error" | "info";
  timeout?: number;
}

// Separate component for rendering the toast list
function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <>
      {toasts.map((toast) => {
        // Type assertion to our custom toast data structure
        const toastData = toast as ToastData;

        return (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={`
              flex items-center justify-between rounded-md px-4 py-3 shadow-lg transition-all
              animate-in slide-in-from-right-full duration-300
              ${
                toastData.type === "error"
                  ? "bg-red-500 text-white"
                  : toastData.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
              }
            `}
          >
            <Toast.Content className="flex items-center justify-between w-full">
              <Toast.Description className="mr-4">
                {toastData.description ?? toastData.message}
              </Toast.Description>
              <Toast.Close className="text-white hover:opacity-80 text-xl leading-none">
                ×
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        );
      })}
    </>
  );
}

// Export the provider that wraps the app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} limit={5} timeout={5000}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

// Custom hook that maintains the same API as before
export function useToast() {
  const manager = Toast.useToastManager();

  const addToast = React.useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      manager.add({
        description: message,
        type, // Store type in the toast data
        timeout: 5000,
      });
    },
    [manager]
  );

  // For backwards compatibility, we don't expose removeToast since Base UI handles it
  const removeToast = React.useCallback(
    (id: string) => {
      manager.close(id);
    },
    [manager]
  );

  return {
    toasts: [], // Not needed in the new API but kept for compatibility
    addToast,
    removeToast,
  };
}

// Optional: Export the manager for use outside of React components
export { toastManager };