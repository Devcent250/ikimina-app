import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: any;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 ring-offset-background transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
            {
              "border-destructive/80 placeholder:text-red-500- text-destructive focus-visible:border-destructive/80 focus-visible:ring-destructive/30":
                error,
            }
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
