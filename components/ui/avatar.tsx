import * as React from "react";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ src, alt, fallback, size = "md", className, ...props }: AvatarProps) {
  return (
    <div
      className={cx(
        "inline-flex items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-700",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || fallback || "Avatar"} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="font-medium">
          {(fallback || "?").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default Avatar;

