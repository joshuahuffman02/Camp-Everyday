import * as React from "react";
import { cn } from "@/lib/utils";

export interface XLogoProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function XLogo({ className, title, ...props }: XLogoProps) {
  const titleId = React.useId();
  const hasTitle = Boolean(title);

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden={hasTitle ? undefined : true}
      aria-labelledby={hasTitle ? titleId : undefined}
      className={cn("h-5 w-5", className)}
      {...props}
    >
      {hasTitle ? <title id={titleId}>{title}</title> : null}
      <path
        fill="currentColor"
        d="M18.244 2H21l-6.764 7.734L22 22h-6.828l-5.356-7.592L3.534 22H0.778l7.17-8.212L2 2h6.99l4.785 6.82L18.244 2z"
      />
    </svg>
  );
}
