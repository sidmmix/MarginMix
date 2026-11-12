import type { HTMLAttributes } from "react";

type BrandNameProps = HTMLAttributes<HTMLSpanElement>;

export function BrandName({ className = "", ...props }: BrandNameProps) {
  return (
    <span className={`mm-brand ${className}`.trim()} {...props}>
      MarginMix
    </span>
  );
}
