import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("p-4 md:p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: DivProps) {
  return (
    <h3
      className={cx("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: DivProps) {
  return (
    <p
      className={cx("text-sm text-neutral-500", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: DivProps) {
  return (
    <div
      className={cx("p-4 md:p-6 pt-0", className)}
      {...props}
    />
  );
}

export default Card;

