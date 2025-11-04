import { Menu } from "@base-ui-components/react/menu";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  className,
}: DropdownMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx("outline-none", className)}>
        {trigger}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Backdrop />
        <Menu.Positioner sideOffset={5} align="end" className="z-[1000]">
          <Menu.Popup className="relative min-w-[160px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg outline-none">
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface DropdownMenuItemProps {
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  variant?: "default" | "danger";
}

export function DropdownMenuItem({
  onSelect,
  children,
  className,
  variant = "default",
}: DropdownMenuItemProps) {
  return (
    <Menu.Item
      onClick={onSelect}
      className={clsx(
        "flex w-full cursor-pointer items-center px-3 py-2 text-sm transition-colors outline-none first:rounded-t-lg last:rounded-b-lg",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100",
        className,
      )}
    >
      {children}
    </Menu.Item>
  );
}
