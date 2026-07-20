import { Avatar as BaseAvatar } from "@base-ui-components/react/avatar";
import { clsx } from "clsx";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }

  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

const sizeClasses = {
  xs: "w-5 h-5 text-[10px] leading-[12px]",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <BaseAvatar.Root
      className={clsx(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100 font-medium text-gray-600",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <BaseAvatar.Image
          src={src}
          alt={name ?? "User avatar"}
          className="h-full w-full object-cover"
        />
      ) : null}
      <BaseAvatar.Fallback className="flex h-full w-full items-center justify-center bg-blue-500 font-semibold text-white">
        {initials}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

